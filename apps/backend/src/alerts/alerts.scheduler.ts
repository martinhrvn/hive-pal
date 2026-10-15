import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';
import { HiveChecker, HiveContext, CheckerContext } from './interfaces';
import { InspectionOverdueChecker, VirginQueenChecker } from './checkers';
import { Prisma } from '@/prisma/client';
import { CURRENT_QUEEN_STATUSES } from 'shared-schemas';

// What the checkers need to know about a hive
const hiveCheckInclude = {
  inspections: {
    select: { date: true },
    orderBy: { date: 'desc' },
    take: 1,
  },
  queens: {
    where: { status: { in: [...CURRENT_QUEEN_STATUSES] } },
    select: {
      id: true,
      name: true,
      marking: true,
      year: true,
      status: true,
      statusChangedAt: true,
      cellCappedAt: true,
      emergedAt: true,
    },
    orderBy: { installedAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.HiveInclude;

type HiveForChecking = Prisma.HiveGetPayload<{
  include: typeof hiveCheckInclude;
}>;

const toHiveContext = (hive: HiveForChecking): HiveContext => ({
  hiveId: hive.id,
  name: hive.name,
  settings: hive.settings,
  lastInspectionDate: hive.inspections[0]?.date,
  status: hive.status,
  apiaryId: hive.apiaryId || undefined,
  currentQueen: hive.queens[0] ?? null,
});

@Injectable()
export class AlertsScheduler {
  private readonly logger = new Logger(AlertsScheduler.name);
  private readonly checkers: HiveChecker[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
    private readonly inspectionOverdueChecker: InspectionOverdueChecker,
    private readonly virginQueenChecker: VirginQueenChecker,
  ) {
    // Register all available checkers
    this.registerChecker(this.inspectionOverdueChecker);
    this.registerChecker(this.virginQueenChecker);
  }

  /**
   * Register a new checker with the scheduler
   */
  private registerChecker(checker: HiveChecker): void {
    this.checkers.push(checker);
    this.logger.log(`Registered checker: ${checker.getCheckerType()}`);
  }

  /**
   * Run every night at 2 AM to check for hive issues
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleAlertCheck() {
    this.logger.log('Starting scheduled alert check');

    try {
      await this.runAlertChecks();
      this.logger.log('Scheduled alert check completed successfully');
    } catch (error) {
      this.logger.error('Failed to complete scheduled alert check', error);
    }
  }

  /**
   * Check a single hive for alerts (used by event handlers)
   */
  async checkSingleHive(hiveId: string): Promise<void> {
    const startTime = new Date();
    this.logger.log(`Checking alerts for single hive ${hiveId}`);

    try {
      const hive = await this.prisma.hive.findFirst({
        where: { id: hiveId, status: 'ACTIVE' },
        include: hiveCheckInclude,
      });

      if (!hive) {
        this.logger.warn(`Hive ${hiveId} not found or not active`);
        return;
      }

      const issuesFound = await this.checkHive(toHiveContext(hive), startTime);
      if (issuesFound > 0) {
        this.logger.log(`Found ${issuesFound} issues for hive ${hiveId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to check alerts for hive ${hiveId}`, error);
      throw error;
    }
  }

  /**
   * Resolve a hive's active alerts of one type once its checker finds no
   * issue, e.g. the virgin queen reminder after she starts laying.
   */
  private async resolveHiveAlerts(hiveId: string, type: string): Promise<void> {
    const resolvedCount = await this.prisma.alert.updateMany({
      where: {
        hiveId,
        type,
        status: 'ACTIVE',
      },
      data: {
        status: 'RESOLVED',
        updatedAt: new Date(),
      },
    });

    if (resolvedCount.count > 0) {
      this.logger.log(
        `Resolved ${resolvedCount.count} active ${type} alerts for hive ${hiveId}`,
      );
    }
  }

  /**
   * Manual trigger for alert checks (useful for testing)
   */
  async runAlertChecks(): Promise<void> {
    const startTime = new Date();
    this.logger.log(
      `Running alert checks with ${this.checkers.length} registered checkers`,
    );

    // Get all active hives with their necessary data
    const hives = await this.prisma.hive.findMany({
      where: { status: 'ACTIVE' },
      include: hiveCheckInclude,
    });
    this.logger.log(`Found ${hives.length} active hives to check`);

    // Hives are independent; the Prisma pool bounds the concurrency
    const results = await Promise.allSettled(
      hives.map((hive) => this.checkHive(toHiveContext(hive), startTime)),
    );

    let totalIssuesFound = 0;
    let totalHivesProcessed = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        totalIssuesFound += result.value;
        totalHivesProcessed++;
      } else {
        // Other hives are still checked even if one fails
        const hive = hives[index];
        this.logger.error(
          `Failed to check hive ${hive.id} (${hive.name})`,
          result.reason,
        );
      }
    });

    this.logger.log(
      `Alert check completed: ${totalHivesProcessed} hives processed, ${totalIssuesFound} total issues found`,
    );
  }

  private async checkHive(
    hive: HiveContext,
    currentTime: Date,
  ): Promise<number> {
    // Create checker context
    const checkerContext: CheckerContext = {
      userId: 'system', // Could be enhanced to track per user
      apiaryId: hive.apiaryId || 'unknown',
      currentTime,
    };

    // Run all checkers against this hive
    const counts = await Promise.all(
      this.checkers.map((checker) =>
        this.runChecker(checker, hive, checkerContext),
      ),
    );
    const totalIssues = counts.reduce((sum, count) => sum + count, 0);

    if (totalIssues > 0) {
      this.logger.log(`Found ${totalIssues} issues for hive "${hive.name}"`);
    }

    return totalIssues;
  }

  /**
   * Run one checker: record its issues, or resolve its alerts when it finds
   * none. Returns the number of issues found (0 if the checker failed).
   */
  private async runChecker(
    checker: HiveChecker,
    hive: HiveContext,
    checkerContext: CheckerContext,
  ): Promise<number> {
    try {
      const issues = checker.checkHive(hive, checkerContext);

      if (issues.length === 0) {
        await this.resolveHiveAlerts(hive.hiveId, checker.getCheckerType());
        return 0;
      }

      this.logger.debug(
        `Checker ${checker.getCheckerType()} found ${issues.length} issues for hive ${hive.name}`,
      );
      await this.alertsService.processIssues(hive.hiveId, issues);
      return issues.length;
    } catch (error) {
      // Other checkers still run even if one fails
      this.logger.error(
        `Checker ${checker.getCheckerType()} failed for hive ${hive.name}`,
        error,
      );
      return 0;
    }
  }

  /**
   * Get registered checker types (useful for debugging/monitoring)
   */
  getRegisteredCheckers(): string[] {
    return this.checkers.map((checker) => checker.getCheckerType());
  }

  /**
   * Clean up old resolved alerts (optional maintenance task)
   * Run once a week at 3 AM Sunday
   */
  @Cron('0 3 * * 0')
  async handleAlertCleanup() {
    this.logger.log('Starting alert cleanup');

    try {
      // Delete resolved alerts older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await this.prisma.alert.deleteMany({
        where: {
          status: 'RESOLVED',
          updatedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(
        `Alert cleanup completed: ${deletedCount.count} old resolved alerts deleted`,
      );
    } catch (error) {
      this.logger.error('Failed to complete alert cleanup', error);
    }
  }
}
