import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';
import { HiveChecker, HiveContext, CheckerContext } from './interfaces';
import { InspectionOverdueChecker } from './checkers';

@Injectable()
export class AlertsScheduler {
  private readonly logger = new Logger(AlertsScheduler.name);
  private readonly checkers: HiveChecker[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
    private readonly inspectionOverdueChecker: InspectionOverdueChecker,
  ) {
    // Register all available checkers
    this.registerChecker(this.inspectionOverdueChecker);
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
      // Get the hive with necessary data
      const hive = await this.getHiveForChecking(hiveId);

      if (!hive) {
        this.logger.warn(`Hive ${hiveId} not found or not active`);
        return;
      }

      const issuesFound = await this.checkHive(hive, startTime);

      if (issuesFound > 0) {
        this.logger.log(`Found ${issuesFound} issues for hive ${hiveId}`);
      } else {
        // If no issues found, resolve any active alerts for this hive
        await this.resolveHiveAlerts(hiveId);
      }
    } catch (error) {
      this.logger.error(`Failed to check alerts for hive ${hiveId}`, error);
      throw error;
    }
  }

  /**
   * Resolve active alerts for a hive when no issues are found
   */
  private async resolveHiveAlerts(hiveId: string): Promise<void> {
    const resolvedCount = await this.prisma.alert.updateMany({
      where: {
        hiveId,
        status: 'ACTIVE',
      },
      data: {
        status: 'RESOLVED',
        updatedAt: new Date(),
      },
    });

    if (resolvedCount.count > 0) {
      this.logger.log(
        `Resolved ${resolvedCount.count} active alerts for hive ${hiveId}`,
      );
    }
  }

  /**
   * Get a single hive for checking
   */
  private async getHiveForChecking(
    hiveId: string,
  ): Promise<HiveContext | null> {
    const hive = await this.prisma.hive.findFirst({
      where: {
        id: hiveId,
        status: 'ACTIVE',
      },
      include: {
        inspections: {
          select: {
            date: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
        apiary: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!hive) {
      return null;
    }

    return {
      hiveId: hive.id,
      name: hive.name,
      settings: hive.settings,
      lastInspectionDate: hive.inspections[0]?.date || null,
      status: hive.status,
      apiaryId: hive.apiaryId || undefined,
    };
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
    const hives = await this.getHivesForChecking();
    this.logger.log(`Found ${hives.length} active hives to check`);

    let totalIssuesFound = 0;
    let totalHivesProcessed = 0;

    // Process each hive
    for (const hive of hives) {
      try {
        const issuesFound = await this.checkHive(hive, startTime);
        totalIssuesFound += issuesFound;
        totalHivesProcessed++;
      } catch (error) {
        this.logger.error(
          `Failed to check hive ${hive.hiveId} (${hive.name})`,
          error,
        );
        // Continue with other hives even if one fails
      }
    }

    this.logger.log(
      `Alert check completed: ${totalHivesProcessed} hives processed, ${totalIssuesFound} total issues found`,
    );
  }

  private async getHivesForChecking(): Promise<HiveContext[]> {
    const hives = await this.prisma.hive.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        inspections: {
          select: {
            date: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
        apiary: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    return hives.map((hive) => ({
      hiveId: hive.id,
      name: hive.name,
      settings: hive.settings,
      lastInspectionDate: hive.inspections[0]?.date || null,
      status: hive.status,
      apiaryId: hive.apiaryId || undefined,
    }));
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

    let totalIssues = 0;

    // Run all checkers against this hive
    for (const checker of this.checkers) {
      try {
        const issues = checker.checkHive(hive, checkerContext);

        if (issues.length > 0) {
          this.logger.debug(
            `Checker ${checker.getCheckerType()} found ${issues.length} issues for hive ${hive.name}`,
          );

          // Process issues through the alerts service
          await this.alertsService.processIssues(hive.hiveId, issues);
          totalIssues += issues.length;
        }
      } catch (error) {
        this.logger.error(
          `Checker ${checker.getCheckerType()} failed for hive ${hive.name}`,
          error,
        );
        // Continue with other checkers even if one fails
      }
    }

    if (totalIssues > 0) {
      this.logger.log(`Found ${totalIssues} issues for hive "${hive.name}"`);
    }

    return totalIssues;
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
