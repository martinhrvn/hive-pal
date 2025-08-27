import { Injectable } from '@nestjs/common';
import {
  HiveChecker,
  HiveContext,
  CheckerContext,
  AlertIssue,
} from '../interfaces';
import { AlertSeverity } from 'shared-schemas';

@Injectable()
export class InspectionOverdueChecker extends HiveChecker {
  getCheckerType(): string {
    return 'inspection_overdue';
  }

  protected getDisplayName(): string {
    return 'Inspection Overdue';
  }

  checkHive(hive: HiveContext, context: CheckerContext): AlertIssue[] {
    const issues: AlertIssue[] = [];

    // Skip if hive is not active
    if (hive.status !== 'ACTIVE') {
      return issues;
    }

    // Get inspection frequency from hive settings (default 7 days)
    const inspectionFrequency = hive.settings?.inspection?.frequencyDays || 7;

    // If no last inspection date, consider it overdue immediately
    if (!hive.lastInspectionDate) {
      issues.push({
        type: this.getCheckerType(),
        message: `Hive "${hive.name}" has no recorded inspections and needs attention`,
        severity: 'MEDIUM',
        metadata: {
          daysSinceLastInspection: null,
          expectedFrequencyDays: inspectionFrequency,
          hiveName: hive.name,
        },
      });
      return issues;
    }

    // Calculate days since last inspection
    const daysSinceLastInspection = Math.floor(
      (context.currentTime.getTime() - hive.lastInspectionDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Only create alert if overdue
    if (daysSinceLastInspection > inspectionFrequency) {
      const daysOverdue = daysSinceLastInspection - inspectionFrequency;

      // Determine severity based on how overdue the inspection is
      let severity: AlertSeverity;
      if (daysOverdue <= 2) {
        severity = 'LOW';
      } else if (daysOverdue <= 7) {
        severity = 'MEDIUM';
      } else {
        severity = 'HIGH';
      }

      const message = this.formatOverdueMessage(
        hive.name,
        daysSinceLastInspection,
        daysOverdue,
      );

      issues.push({
        type: this.getCheckerType(),
        message,
        severity,
        metadata: {
          daysSinceLastInspection,
          daysOverdue,
          expectedFrequencyDays: inspectionFrequency,
          hiveName: hive.name,
          lastInspectionDate: hive.lastInspectionDate.toISOString(),
        },
      });
    }

    return issues;
  }

  private formatOverdueMessage(
    hiveName: string,
    daysSinceLastInspection: number,
    daysOverdue: number,
  ): string {
    if (daysOverdue <= 2) {
      return `Hive "${hiveName}" is slightly overdue for inspection (${daysSinceLastInspection} days since last inspection)`;
    } else if (daysOverdue <= 7) {
      return `Hive "${hiveName}" is overdue for inspection (${daysSinceLastInspection} days since last inspection)`;
    } else {
      return `Hive "${hiveName}" is significantly overdue for inspection (${daysSinceLastInspection} days since last inspection)`;
    }
  }
}
