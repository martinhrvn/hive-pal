import { Injectable } from '@nestjs/common';
import {
  HiveChecker,
  HiveContext,
  CheckerContext,
  AlertIssue,
} from '../interfaces';
import { differenceInCalendarDays } from 'date-fns';
import {
  AlertSeverity,
  findNextInspectionDue,
  getEffectiveSchedule,
  getInspectionFrequencyForSeasons,
  isInspectionPausedOn,
  type ApiarySeasonSettings,
  type HiveSeasonSettings,
} from 'shared-schemas';

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

    const { seasons, baseInspectionFrequencyDays } = getEffectiveSchedule(
      hive.settings as HiveSeasonSettings | null | undefined,
      hive.apiarySettings as ApiarySeasonSettings | null | undefined,
    );

    // Nothing is overdue in a season without inspections (e.g. winter).
    if (isInspectionPausedOn(seasons, context.currentTime)) {
      return issues;
    }

    // If no last inspection date, consider it overdue immediately
    if (!hive.lastInspectionDate) {
      issues.push({
        type: this.getCheckerType(),
        message: `Hive "${hive.name}" has no recorded inspections and needs attention`,
        severity: 'MEDIUM',
        metadata: {
          daysSinceLastInspection: null as number | null,
          expectedFrequencyDays: getInspectionFrequencyForSeasons(
            seasons,
            baseInspectionFrequencyDays,
            context.currentTime,
          ),
          hiveName: hive.name,
        },
      });
      return issues;
    }

    // The due date the calendar projection uses: the interval in force the
    // day after the last inspection (a season starting or ending since then
    // does not move it), pushed past any season without inspections.
    const dueDate = findNextInspectionDue(
      seasons,
      baseInspectionFrequencyDays,
      hive.lastInspectionDate,
    );
    if (!dueDate) {
      return issues;
    }
    // The interval, unless a season without inspections moved the due date.
    const dueAfterDays = differenceInCalendarDays(
      dueDate,
      hive.lastInspectionDate,
    );

    // Calculate days since last inspection
    const daysSinceLastInspection = Math.floor(
      (context.currentTime.getTime() - hive.lastInspectionDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Only create alert if overdue
    if (daysSinceLastInspection > dueAfterDays) {
      const daysOverdue = daysSinceLastInspection - dueAfterDays;

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
          expectedFrequencyDays: dueAfterDays,
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
