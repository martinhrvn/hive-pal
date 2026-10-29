import { addDays, format, isBefore, startOfDay } from 'date-fns';
import {
  findNextInspectionDue,
  getEffectiveSchedule,
  getInspectionFrequencyForSeasons,
  isInspectionPausedOn,
  nextInspectableDay,
  type ApiarySeasonSettings,
  type HiveSeasonSettings,
  type Season,
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

const isScheduled = (hive: InspectionScheduleHive) =>
  hive.status === 'ACTIVE' &&
  hive.settings?.inspection?.calendarEnabled !== false;

/**
 * Where a hive's projection starts and whether that day is overdue, or
 * `undefined` when nothing can be scheduled.
 */
function firstDue(
  hive: InspectionScheduleHive,
  seasons: Season[],
  baseDays: number,
  today: Date,
): { due: Date; isOverdue: boolean } | undefined {
  const last = hive.lastInspectionDate;
  const due = last ? findNextInspectionDue(seasons, baseDays, last) : today;
  if (!due) return undefined; // Inspections are paused all year.

  // Never inspected: due, and overdue, today.
  const isOverdue = !last || isBefore(due, today);
  if (!isOverdue || !isInspectionPausedOn(seasons, today)) {
    return { due, isOverdue };
  }
  // Nothing is overdue in a season without inspections: the hive is due
  // again the first day after it ends.
  const resumes = nextInspectableDay(seasons, today);
  return resumes ? { due: resumes, isOverdue: false } : undefined;
}

/** One hive's overdue event (if any) and its scheduled ones up to the limit. */
function projectHive(
  hive: InspectionScheduleHive,
  today: Date,
  futureLimit: Date,
): ProjectedInspectionEvent[] {
  // Resolve (and validate) the seasons once per hive, not once per date.
  const { seasons, baseInspectionFrequencyDays: baseDays } =
    getEffectiveSchedule(hive.settings, hive.apiarySettings);
  const frequencyAt = (date: Date) =>
    getInspectionFrequencyForSeasons(seasons, baseDays, date);

  const start = firstDue(hive, seasons, baseDays, today);
  if (!start) return [];

  const events: ProjectedInspectionEvent[] = [];
  let due: Date | undefined = start.due;

  if (start.isOverdue) {
    const todayFrequency = frequencyAt(today);
    events.push({
      uid: `overdue-${hive.hiveId}-${format(today, 'yyyyMMdd')}@hivepal`,
      summary: `OVERDUE: ${hive.name} Inspection`,
      dtstart: today,
      description: `Inspection for ${hive.name} is overdue. Based on ${todayFrequency}-day frequency.`,
      isOverdue: true,
      isAllDay: true,
    });
    due = nextInspectableDay(seasons, addDays(today, todayFrequency));
  }

  // `due` is never before today here, and only moves forward.
  while (due && !isBefore(futureLimit, due)) {
    const frequency = frequencyAt(due);
    events.push({
      uid: `scheduled-${hive.hiveId}-${format(due, 'yyyyMMdd')}@hivepal`,
      summary: `${hive.name} Inspection`,
      dtstart: due,
      description: `Scheduled inspection for ${hive.name} (every ${frequency} days)`,
      isAllDay: true,
    });
    // A due date inside a season without inspections waits for its end.
    due = nextInspectableDay(seasons, addDays(due, frequency));
  }
  return events;
}

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
  const today = startOfDay(todayInput);
  const futureLimit = addDays(today, futureWeeks * 7);

  const events = hives
    .filter(isScheduled)
    .flatMap((hive) => projectHive(hive, today, futureLimit));
  events.sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());
  return events;
}
