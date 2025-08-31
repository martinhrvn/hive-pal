import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionStatus } from 'shared-schemas';

@Injectable()
export class InspectionStatusUpdaterService {
  private readonly logger = new Logger(InspectionStatusUpdaterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run every day at 1 AM to update overdue inspection statuses
   * This runs before the alert checker at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async updateOverdueInspections(): Promise<void> {
    this.logger.log('Starting scheduled inspection status update');

    try {
      const updatedCount = await this.markOverdueInspections();
      this.logger.log(`Marked ${updatedCount} inspections as overdue`);
    } catch (error) {
      this.logger.error('Failed to update overdue inspection statuses', error);
    }
  }

  /**
   * Mark scheduled inspections as overdue if their date has passed
   * @returns number of inspections updated
   */
  async markOverdueInspections(): Promise<number> {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of current day

    const result = await this.prisma.inspection.updateMany({
      where: {
        status: InspectionStatus.SCHEDULED,
        date: {
          lt: now, // Less than start of today
        },
      },
      data: {
        status: InspectionStatus.OVERDUE,
      },
    });

    return result.count;
  }

  /**
   * Update inspection status for a specific inspection
   * Called when inspections are queried to ensure real-time accuracy
   */
  async updateInspectionStatusIfNeeded(inspectionId: string): Promise<void> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      select: { id: true, status: true, date: true },
    });

    if (!inspection || inspection.status !== InspectionStatus.SCHEDULED) {
      return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (inspection.date < now) {
      await this.prisma.inspection.update({
        where: { id: inspectionId },
        data: { status: InspectionStatus.OVERDUE },
      });

      this.logger.debug(`Updated inspection ${inspectionId} to OVERDUE status`);
    }
  }

  /**
   * Check if any scheduled inspections need status updates
   * Returns the updated inspection statuses
   */
  async checkAndUpdateInspectionStatuses(): Promise<void> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Find all scheduled inspections that should be overdue
    const overdueInspections = await this.prisma.inspection.findMany({
      where: {
        status: InspectionStatus.SCHEDULED,
        date: {
          lt: now,
        },
      },
      select: { id: true },
    });

    if (overdueInspections.length > 0) {
      const inspectionIds = overdueInspections.map((i) => i.id);

      await this.prisma.inspection.updateMany({
        where: {
          id: {
            in: inspectionIds,
          },
        },
        data: {
          status: InspectionStatus.OVERDUE,
        },
      });

      this.logger.debug(
        `Updated ${overdueInspections.length} inspections to OVERDUE status`,
      );
    }
  }
}
