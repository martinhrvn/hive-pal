import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SwarmAlertService } from './swarm-alert.service';

@Injectable()
export class SwarmAlertScheduler {
  private readonly logger = new Logger(SwarmAlertScheduler.name);

  constructor(private readonly swarmAlertService: SwarmAlertService) {}

  /**
   * Check for swarm alerts every 15 minutes.
   * The interval should be less than or equal to the HiveScale send interval
   * so no measurement is missed between checks.
   */
  @Cron('0 */15 * * * *')
  async handleSwarmAlertCheck() {
    this.logger.log('Running scheduled swarm alert check');

    try {
      await this.swarmAlertService.checkAllUsers();
    } catch (error) {
      this.logger.error('Swarm alert scheduler encountered an error', error);
    }
  }
}
