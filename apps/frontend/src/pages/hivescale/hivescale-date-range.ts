// Shared date-range types and helpers for the HiveScale pages. These used to
// live in hivescale-diagram-panel.tsx; they are extracted here so the panels
// and the modular dashboard can consume them without depending on the (now
// removed) diagram panel component.

export type HiveScaleDateRangePreset =
  | '24h'
  | '7d'
  | '30d'
  | '365d'
  | 'currentYear'
  | 'all'
  | 'custom';

export interface HiveScaleDateRange {
  preset: HiveScaleDateRangePreset;
  startAt?: string;
  endAt?: string;
}

const MEASUREMENT_SAMPLES_PER_DAY = (24 * 60) / 5; // ~5-min cadence => 288/day
const MAX_MEASUREMENT_POINTS = 20000;

const measurementLimitForDays = (days: number): number =>
  Math.min(
    MAX_MEASUREMENT_POINTS,
    Math.max(1, Math.ceil(days * MEASUREMENT_SAMPLES_PER_DAY)),
  );

export const measurementLimitForRange = (range: HiveScaleDateRange): number => {
  switch (range.preset) {
    case '24h':
      return measurementLimitForDays(1);
    case '7d':
      return measurementLimitForDays(7);
    case '30d':
      return measurementLimitForDays(30);
    case '365d':
    case 'currentYear':
      return MAX_MEASUREMENT_POINTS;
    case 'custom': {
      if (range.startAt) {
        const startMs = new Date(range.startAt).getTime();
        const endMs = range.endAt
          ? new Date(range.endAt).getTime()
          : Date.now();
        const days = (endMs - startMs) / (24 * 60 * 60 * 1000);
        if (Number.isFinite(days) && days > 0) {
          return measurementLimitForDays(days);
        }
      }
      return MAX_MEASUREMENT_POINTS;
    }
    case 'all':
    default:
      return MAX_MEASUREMENT_POINTS;
  }
};

export const createPresetDateRange = (
  preset: HiveScaleDateRangePreset,
): HiveScaleDateRange => {
  const now = new Date();
  switch (preset) {
    case '24h':
      return {
        preset,
        startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      };
    case '7d':
      return {
        preset,
        startAt: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    case '30d':
      return {
        preset,
        startAt: new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    case '365d':
      return {
        preset,
        startAt: new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    case 'currentYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { preset, startAt: start.toISOString() };
    }
    case 'all':
      return { preset };
    case 'custom':
      return { preset };
    default:
      return {
        preset: '7d',
        startAt: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
  }
};

const pad2 = (value: number) => String(value).padStart(2, '0');

/** `YYYY-MM-DD` in local time, as an `<input type="date">` expects. */
export const toLocalDateInputValue = (
  value: string | number | Date | null | undefined,
): string => {
  if (value === null || value === undefined || value === '') return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const parseLocalDateInput = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isFinite(date.getTime()) ? date : null;
};

/**
 * Build a custom range from two local calendar days. The end day is inclusive
 * (up to 23:59:59.999 local), and an empty end means "until now". Returns null
 * when the start is missing/invalid or lies after the end.
 */
export const createCustomDateRange = (
  startDate: string,
  endDate: string,
): HiveScaleDateRange | null => {
  const start = parseLocalDateInput(startDate);
  if (!start) return null;
  let endAt: string | undefined;
  if (endDate.trim()) {
    const end = parseLocalDateInput(endDate);
    if (!end) return null;
    end.setHours(23, 59, 59, 999);
    if (end.getTime() < start.getTime()) return null;
    endAt = end.toISOString();
  }
  return { preset: 'custom', startAt: start.toISOString(), endAt };
};
