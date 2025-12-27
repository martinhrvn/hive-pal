import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlatformMetricsService } from './platform-metrics.service';

@Injectable()
export class PlatformMetricsScheduler {
  private readonly logger = new Logger(PlatformMetricsScheduler.name);

  constructor(
    private readonly platformMetricsService: PlatformMetricsService,
  ) {}

  /**
   * Run every day at 2 AM to record daily metrics snapshot
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyMetricsSnapshot() {
    this.logger.log('Starting daily platform metrics snapshot');

    try {
      const snapshot = await this.platformMetricsService.recordSnapshot();
      this.logger.log(
        `Daily metrics snapshot recorded: ${snapshot.totalUsers} users, ${snapshot.totalHives} hives, ${snapshot.activeUsers7Days} active (7d)`,
      );
    } catch (error) {
      this.logger.error('Failed to record daily metrics snapshot', error);
    }
  }
}
