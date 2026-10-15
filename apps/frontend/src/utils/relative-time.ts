import { differenceInCalendarDays } from 'date-fns';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Anything `new Date()` accepts: a Date, an ISO string or epoch milliseconds. */
export type DateInput = Date | string | number;

const formatters = new Map<string, Intl.RelativeTimeFormat>();

/** One cached formatter per language ("yesterday", "in 3 days"). */
const relativeTimeFormat = (language: string) => {
  let formatter = formatters.get(language);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    formatters.set(language, formatter);
  }
  return formatter;
};

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * DAY_MS],
  ['month', 30 * DAY_MS],
  ['day', DAY_MS],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

const toTime = (date: DateInput) => new Date(date).getTime();

/**
 * "3 hours ago" / "in 2 days", using the largest unit that fits. Returns null
 * for an unparseable date so callers pick their own placeholder.
 */
export function formatRelativeTime(
  date: DateInput,
  language: string,
  now: number = Date.now(),
): string | null {
  const time = toTime(date);
  if (!Number.isFinite(time)) return null;
  const diffMs = time - now;
  const [unit, unitMs] = UNITS.find(([, ms]) => Math.abs(diffMs) >= ms) ?? [
    'second',
    1000,
  ];
  return relativeTimeFormat(language).format(Math.round(diffMs / unitMs), unit);
}

/**
 * Relative date in whole calendar days ("today", "yesterday", "5 days ago"),
 * so something that happened last evening is "yesterday", not "today".
 */
export function formatRelativeDays(
  date: DateInput,
  language: string,
  now: Date = new Date(),
): string {
  const days = differenceInCalendarDays(new Date(date), now);
  return relativeTimeFormat(language).format(days, 'day');
}

/** Calendar days from `date` until `now` (positive for the past). */
export const daysAgo = (date: DateInput, now: Date = new Date()) =>
  differenceInCalendarDays(now, new Date(date));
