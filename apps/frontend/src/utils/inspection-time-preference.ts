/**
 * Remembers the time-of-day the user last chose for an inspection, so a new
 * inspection can default to that instead of always falling back to "all day".
 *
 * This is a lightweight, per-device UX convenience persisted in localStorage —
 * no API or schema changes required.
 */

const STORAGE_KEY = 'hivepal:lastInspectionTime';

export interface LastInspectionTimePreference {
  isAllDay: boolean;
  hours: number;
  minutes: number;
}

/**
 * Read the last-used inspection time preference, or null if none has been
 * stored yet (or the stored value is unreadable).
 */
export function getLastInspectionTimePreference(): LastInspectionTimePreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastInspectionTimePreference>;
    if (
      typeof parsed.isAllDay !== 'boolean' ||
      typeof parsed.hours !== 'number' ||
      typeof parsed.minutes !== 'number' ||
      parsed.hours < 0 ||
      parsed.hours > 23 ||
      parsed.minutes < 0 ||
      parsed.minutes > 59
    ) {
      return null;
    }
    return {
      isAllDay: parsed.isAllDay,
      hours: parsed.hours,
      minutes: parsed.minutes,
    };
  } catch {
    return null;
  }
}

/**
 * Persist the time-of-day / all-day choice from a saved inspection so the next
 * new inspection can reuse it as its default.
 */
export function saveLastInspectionTimePreference(
  date: Date,
  isAllDay: boolean,
): void {
  if (typeof window === 'undefined') return;
  try {
    const value: LastInspectionTimePreference = {
      isAllDay,
      hours: date.getHours(),
      minutes: date.getMinutes(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private mode, quota) — ignore silently.
  }
}

/**
 * Build the default date for a brand-new inspection, seeding the time-of-day
 * from the last-used preference when available. Returns both the date and the
 * matching all-day flag so the form can initialise consistently.
 */
export function getDefaultInspectionDateTime(now: Date = new Date()): {
  date: Date;
  isAllDay: boolean;
} {
  const pref = getLastInspectionTimePreference();
  if (!pref) {
    // No history yet — preserve the previous default (all day).
    return { date: now, isAllDay: true };
  }
  const date = new Date(now);
  if (pref.isAllDay) {
    date.setHours(0, 0, 0, 0);
    return { date, isAllDay: true };
  }
  date.setHours(pref.hours, pref.minutes, 0, 0);
  return { date, isAllDay: false };
}
