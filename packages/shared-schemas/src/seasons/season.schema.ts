import { z } from 'zod';
import { isValidMonthDay, monthDayOrdinal } from './season.date';

/** A month/day pair, e.g. `{ month: 3, day: 15 }`. */
export const seasonMonthDaySchema = z.object({
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
});

export type SeasonMonthDay = z.infer<typeof seasonMonthDaySchema>;

/** Feeding configuration for a season. Only feeding seasons need a target. */
export const seasonFeedingSchema = z.object({
  enabled: z.boolean().default(false),
  /** Target amount in kg of sugar equivalent. */
  targetKg: z.number().positive().nullish(),
});

export type SeasonFeeding = z.infer<typeof seasonFeedingSchema>;

/**
 * One season in a hive's or apiary's calendar.
 *
 * `name` may be empty: migrated/default seasons then render a localized
 * fallback label instead of storing an English string in user data.
 * The season may wrap the year (`start` after `end`, e.g. Nov 15 - Feb 28).
 */
export const seasonSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().max(60).default(''),
    start: seasonMonthDaySchema,
    end: seasonMonthDaySchema,
    inspectionFrequencyDays: z.number().int().min(1).max(365).nullish(),
    feeding: seasonFeedingSchema.default({ enabled: false }),
  })
  .superRefine((season, ctx) => {
    for (const key of ['start', 'end'] as const) {
      const value = season[key];
      if (!isValidMonthDay(value.month, value.day)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Not a valid calendar day',
          path: [key],
        });
      }
    }
    if (season.feeding.enabled && season.feeding.targetKg == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Set a feeding target or turn feeding off for this season',
        path: ['feeding', 'targetKg'],
      });
    }
  });

export type Season = z.infer<typeof seasonSchema>;

type SeasonLike = {
  start: { month: number; day: number };
  end: { month: number; day: number };
};

export interface SeasonDayInterval {
  start: number;
  end: number;
}

/**
 * A season's covered day ordinals. Wrapped seasons are split into the end of
 * the year and the start of the year so overlap checks stay simple.
 */
export function seasonDayIntervals(season: SeasonLike): SeasonDayInterval[] {
  const start = monthDayOrdinal(season.start.month, season.start.day);
  const end = monthDayOrdinal(season.end.month, season.end.day);
  if (start <= end) return [{ start, end }];
  return [
    { start, end: 1231 },
    { start: 101, end },
  ];
}

/** True when two seasons share at least one calendar day. */
export function seasonsOverlap(a: SeasonLike, b: SeasonLike): boolean {
  const aIntervals = seasonDayIntervals(a);
  const bIntervals = seasonDayIntervals(b);
  return aIntervals.some(aInterval =>
    bIntervals.some(
      bInterval =>
        aInterval.start <= bInterval.end && bInterval.start <= aInterval.end,
    ),
  );
}

/** First overlapping pair of seasons, as array indexes, if any. */
export function findOverlappingSeasonPair(
  seasons: SeasonLike[],
): [number, number] | undefined {
  for (let i = 0; i < seasons.length; i += 1) {
    for (let j = i + 1; j < seasons.length; j += 1) {
      if (seasonsOverlap(seasons[i], seasons[j])) return [i, j];
    }
  }
  return undefined;
}

/**
 * A validated list of seasons. Overlaps are rejected: a date can belong to at
 * most one season. Boundaries may touch (May 31 / Jun 1) without overlapping.
 */
export const seasonListSchema = z
  .array(seasonSchema)
  .superRefine((seasons, ctx) => {
    const firstOverlap = findOverlappingSeasonPair(seasons);
    if (firstOverlap) {
      const [first, second] = firstOverlap;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Season "${seasons[second].name || second + 1}" overlaps "${seasons[first].name || first + 1}"`,
        path: [second],
      });
    }
  });

export type SeasonList = z.infer<typeof seasonListSchema>;

/**
 * Settings that apply all year on days no season covers. Seasons override
 * them. Only the inspection interval for now; the inspection checklist will
 * live here too.
 */
export const yearRoundScheduleSchema = z.object({
  /** Empty means hives fall back to their own base interval. */
  inspectionFrequencyDays: z.number().int().min(1).max(365).nullish(),
});

export type YearRoundSchedule = z.infer<typeof yearRoundScheduleSchema>;
