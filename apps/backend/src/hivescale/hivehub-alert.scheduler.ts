import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HiveHubAlertService } from './hivehub-alert.service';

@Injectable()
export class HiveHubAlertScheduler {
  private readonly logger = new Logger(HiveHubAlertScheduler.name);
  private running = false;

  constructor(private readonly hiveHubAlertService: HiveHubAlertService) {}

  /**
   * HiveHub's insight reconciler refreshes alerts every 15 minutes by default
   * (INSIGHTS_RECONCILE_INTERVAL_SECONDS), so checking more often finds nothing
   * new.
   */
  @Cron('0 */15 * * * *')
  async handleAlertCheck() {
    if (this.running) return;
    this.running = true;
    try {
      await this.hiveHubAlertService.checkAllUsers();
    } catch (error) {
      this.logger.error('HiveHub alert scheduler encountered an error', error);
    } finally {
      this.running = false;
    }
  }
}
