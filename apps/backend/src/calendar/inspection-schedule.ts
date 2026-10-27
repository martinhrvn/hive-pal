import { addDays, format, isBefore, startOfDay } from 'date-fns';
import {
  findNextInspectionDue,
  getEffectiveSchedule,
  getInspectionFrequencyForSeasons,
  isInspectionPausedOn,
  nextInspectableDay,
  type ApiarySeasonSettings,
  type HiveSeasonSettings,
} from 'shared-schemas';

export interface ProjectedInspectionEvent {
  uid: string;
  summary: string;
  dtstart: Date;
  description: string;
  isOverdue?: boolean;
  isAllDay?: boolean;
}

export interface InspectionScheduleHive {
  hiveId: string;
  name: string;
  status: string;
  settings?: HiveSeasonSettings | null;
  apiarySettings?: ApiarySeasonSettings | null;
  lastInspectionDate?: Date | null;
}

export const INSPECTION_FUTURE_WEEKS = 6;

/**
 * Project inspection events for a set of hives.
 *
 * The interval is season-aware: the first due date uses the interval in force
 * the day after the last inspection (so a season boundary is crossed from the
 * right side), and every later projection uses the interval in force at the
 * previous due date. Overdue hives get one overdue event for today and are
 * projected forward from today.
 */
export function buildScheduledInspectionEvents(
  hives: InspectionScheduleHive[],
  todayInput: Date = new Date(),
  futureWeeks: number = INSPECTION_FUTURE_WEEKS,
): ProjectedInspectionEvent[] {
  const events: ProjectedInspectionEvent[] = [];
  const today = startOfDay(todayInput);
  const futureLimit = addDays(today, futureWeeks * 7);

  for (const hive of hives) {
    if (hive.status !== 'ACTIVE') continue;
    if (hive.settings?.inspection?.calendarEnabled === false) continue;

    // Resolve (and validate) the seasons once per hive, not once per date.
    const { seasons, baseInspectionFrequencyDays: baseDays } =
      getEffectiveSchedule(hive.settings, hive.apiarySettings);
    const frequencyAt = (date: Date) =>
      getInspectionFrequencyForSeasons(seasons, baseDays, date);

    let nextDue: Date | undefined;
    let isOverdue: boolean;

    if (!hive.lastInspectionDate) {
      nextDue = today;
      isOverdue = true;
    } else {
      nextDue = findNextInspectionDue(
        seasons,
        baseDays,
        hive.lastInspectionDate,
      );
      if (!nextDue) continue; // Inspections are paused all year.
      isOverdue = isBefore(nextDue, today);
    }

    // Nothing is overdue in a season without inspections: the hive is due
    // again the day it ends.
    if (isOverdue && isInspectionPausedOn(seasons, today)) {
      nextDue = nextInspectableDay(seasons, today);
      if (!nextDue) continue;
      isOverdue = false;
    }

    if (isOverdue) {
      const todayFrequency = frequencyAt(today);
      events.push({
        uid: `overdue-${hive.hiveId}-${format(today, 'yyyyMMdd')}@hivepal`,
        summary: `OVERDUE: ${hive.name} Inspection`,
        dtstart: today,
        description: `Inspection for ${hive.name} is overdue. Based on ${todayFrequency}-day frequency.`,
        isOverdue: true,
        isAllDay: true,
      });
      nextDue = nextInspectableDay(seasons, addDays(today, todayFrequency));
    }

    let currentDate: Date | undefined = nextDue;
    while (currentDate && !isBefore(futureLimit, currentDate)) {
      if (!isBefore(currentDate, today)) {
        const frequency = frequencyAt(currentDate);
        events.push({
          uid: `scheduled-${hive.hiveId}-${format(currentDate, 'yyyyMMdd')}@hivepal`,
          summary: `${hive.name} Inspection`,
          dtstart: currentDate,
          description: `Scheduled inspection for ${hive.name} (every ${frequency} days)`,
          isAllDay: true,
        });
        // A due date inside a season without inspections waits for its end.
        currentDate = nextInspectableDay(
          seasons,
          addDays(currentDate, frequency),
        );
      } else {
        currentDate = addDays(currentDate, 1);
      }
    }
  }

  events.sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());
  return events;
}
