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
