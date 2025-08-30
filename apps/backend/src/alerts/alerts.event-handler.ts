import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  HiveUpdatedEvent,
  InspectionCreatedEvent,
  HiveCreatedEvent,
} from '../events/hive.events';
import { AlertsScheduler } from './alerts.scheduler';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsEventHandler {
  private readonly logger = new Logger(AlertsEventHandler.name);

  constructor(
    private readonly alertsScheduler: AlertsScheduler,
    private readonly alertsService: AlertsService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('hive.created')
  async handleHiveCreated(event: HiveCreatedEvent) {
    this.logger.log(`Handling hive created event for hive ${event.hiveId}`);

    // For new hives, we might want to check for initial alerts
    // (e.g., no inspections yet)
    await this.checkHiveAlerts(event.hiveId);
  }

  @OnEvent('hive.updated')
  async handleHiveUpdated(event: HiveUpdatedEvent) {
    this.logger.log(
      `Handling hive updated event for hive ${event.hiveId} (type: ${event.updateType})`,
    );

    // Re-check alerts for the updated hive
    await this.checkHiveAlerts(event.hiveId);
  }

  @OnEvent('inspection.created')
  async handleInspectionCreated(event: InspectionCreatedEvent) {
    this.logger.log(
      `Handling inspection created event for hive ${event.hiveId}`,
    );

    // When a new inspection is created, we should clear any inspection-related alerts
    // and re-check the hive status
    await this.clearInspectionAlerts(event.hiveId);
    await this.checkHiveAlerts(event.hiveId);
  }

  private async checkHiveAlerts(hiveId: string): Promise<void> {
    try {
      this.logger.debug(`Checking alerts for hive ${hiveId}`);

      // Use the scheduler's single hive check method
      await this.alertsScheduler.checkSingleHive(hiveId);

      this.logger.debug(`Alert check completed for hive ${hiveId}`);
    } catch (error) {
      this.logger.error(`Failed to check alerts for hive ${hiveId}`, error);
    }
  }

  private async clearInspectionAlerts(hiveId: string): Promise<void> {
    try {
      this.logger.debug(`Clearing inspection alerts for hive ${hiveId}`);

      // Find and resolve any active inspection_overdue alerts for this hive
      const activeInspectionAlerts = await this.prisma.alert.findMany({
        where: {
          hiveId,
          type: 'inspection_overdue',
          status: 'ACTIVE',
        },
      });

      if (activeInspectionAlerts.length > 0) {
        // Resolve all active inspection overdue alerts
        await this.prisma.alert.updateMany({
          where: {
            hiveId,
            type: 'inspection_overdue',
            status: 'ACTIVE',
          },
          data: {
            status: 'RESOLVED',
            updatedAt: new Date(),
          },
        });

        this.logger.log(
          `Resolved ${activeInspectionAlerts.length} inspection overdue alerts for hive ${hiveId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to clear inspection alerts for hive ${hiveId}`,
        error,
      );
    }
  }
}
