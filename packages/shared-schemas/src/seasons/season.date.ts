/**
 * Calendar helpers for month/day season boundaries.
 *
 * Seasons are stored as month + day (no year): they repeat every calendar
 * year. This module deliberately has no schema imports so both the schema
 * refinements and the runtime resolvers can use it.
 */

/** Reference year used to validate month/day pairs; 2000 is a leap year. */
export const SEASON_REFERENCE_YEAR = 2000;

const MONTH_LENGTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Number of days in `month` (1-12) of `year`. */
export function daysInMonth(month: number, year: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return MONTH_LENGTHS[month - 1] ?? 31;
}

/** True when month/day exists in a leap year (so Feb 29 is allowed). */
export function isValidMonthDay(month: number, day: number): boolean {
  return (
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(month, SEASON_REFERENCE_YEAR)
  );
}

/** Sortable ordinal for a month/day pair, e.g. May 5 -> 505. */
export function monthDayOrdinal(month: number, day: number): number {
  return month * 100 + day;
}

/** Clamp a day to the real length of its month in `year` (Feb 29 -> Feb 28). */
export function clampDayToMonth(
  month: number,
  day: number,
  year: number,
): number {
  return Math.min(day, daysInMonth(month, year));
}

/** Local start-of-day for a month/day in `year`, clamped for short months. */
export function seasonDateInYear(
  month: number,
  day: number,
  year: number,
): Date {
  return new Date(
    year,
    month - 1,
    clampDayToMonth(month, day, year),
    0,
    0,
    0,
    0,
  );
}

/** Local end-of-day for a month/day in `year`, clamped for short months. */
export function seasonEndDateInYear(
  month: number,
  day: number,
  year: number,
): Date {
  return new Date(
    year,
    month - 1,
    clampDayToMonth(month, day, year),
    23,
    59,
    59,
    999,
  );
}
