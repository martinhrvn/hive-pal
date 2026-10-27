import { seasonListSchema, type Season } from './season.schema';
import {
  clampDayToMonth,
  daysInMonth,
  monthDayOrdinal,
  seasonDateInYear,
  seasonEndDateInYear,
} from './season.date';

/** Fallback inspection interval when neither a season nor the hive sets one. */
export const DEFAULT_INSPECTION_FREQUENCY_DAYS = 7;

/** Stable ids for seasons synthesized from legacy/default settings. */
export const LEGACY_AUTUMN_SEASON_ID = '00000000-0000-4000-8000-000000000001';
export const DEFAULT_FEEDING_SEASON_ID = '00000000-0000-4000-8000-000000000002';

/** The feeding window Hive Pal used before seasons existed. */
export const DEFAULT_FEEDING_SEASON: Season = {
  id: DEFAULT_FEEDING_SEASON_ID,
  name: '',
  start: { month: 8, day: 1 },
  end: { month: 10, day: 31 },
  inspectionFrequencyDays: null,
  feeding: { enabled: true, targetKg: 12 },
};

export interface LegacyAutumnFeeding {
  startMonth: number;
  endMonth: number;
  amountKg: number;
}

/** Hive settings fields the season resolver understands. */
export interface HiveSeasonSettings {
  seasons?: unknown;
  /** @deprecated Pre-seasons autumn feeding window. */
  autumnFeeding?: LegacyAutumnFeeding | null;
  inspection?: {
    frequencyDays?: number;
    calendarEnabled?: boolean;
  } | null;
}

/** Apiary settings fields the season resolver understands. */
export interface ApiarySeasonSettings {
  seasons?: unknown;
}

export type SeasonSource = 'hive' | 'legacy' | 'apiary' | 'default';

export interface EffectiveSeasons {
  seasons: Season[];
  source: SeasonSource;
}

export interface SeasonWindow {
  start: Date;
  end: Date;
}

export interface RelevantFeedingSeason {
  season: Season;
  window: SeasonWindow;
  isActive: boolean;
}

/** Convert the legacy month-only autumn feeding window into one season. */
export function seasonFromLegacy(legacy: LegacyAutumnFeeding): Season {
  const { startMonth, endMonth, amountKg } = legacy;
  const validMonths = [startMonth, endMonth].every(
    month => Number.isInteger(month) && month >= 1 && month <= 12,
  );
  if (!validMonths || !Number.isFinite(amountKg) || amountKg <= 0) {
    return { ...DEFAULT_FEEDING_SEASON };
  }
  return {
    id: LEGACY_AUTUMN_SEASON_ID,
    name: '',
    start: { month: startMonth, day: 1 },
    end: { month: endMonth, day: daysInMonth(endMonth, 2000) },
    inspectionFrequencyDays: null,
    feeding: { enabled: true, targetKg: amountKg },
  };
}

/**
 * True when the legacy value is the Aug–Oct / 12 kg default that hive creation
 * and the 2025 settings migration stamped onto every hive. Nobody chose it, so
 * it must not shadow the apiary's season template.
 */
export function isDefaultLegacyAutumnFeeding(
  legacy: LegacyAutumnFeeding,
): boolean {
  return (
    legacy.startMonth === 8 && legacy.endMonth === 10 && legacy.amountKg === 12
  );
}

/** Validate a stored season list, returning `[]` for malformed data. */
export function parseSeasons(raw: unknown): Season[] {
  const parsed = seasonListSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

/**
 * Resolve the seasons that actually govern a hive.
 *
 * A hive-owned list (even an explicit empty one) wins over the apiary
 * template. A customised legacy autumn feeding window also wins, so hives the
 * user tuned keep behaving as before; the untouched legacy default does not
 * (it equals the built-in default season anyway). When nothing is configured
 * anywhere, the historical default autumn feeding season applies.
 */
export function getEffectiveSeasons(
  hiveSettings?: HiveSeasonSettings | null,
  apiarySettings?: ApiarySeasonSettings | null,
): EffectiveSeasons {
  if (hiveSettings?.seasons != null) {
    const parsed = seasonListSchema.safeParse(hiveSettings.seasons);
    if (parsed.success) return { seasons: parsed.data, source: 'hive' };
  }

  if (
    hiveSettings?.autumnFeeding != null &&
    !isDefaultLegacyAutumnFeeding(hiveSettings.autumnFeeding)
  ) {
    return {
      seasons: [seasonFromLegacy(hiveSettings.autumnFeeding)],
      source: 'legacy',
    };
  }

  if (apiarySettings?.seasons != null) {
    const parsed = seasonListSchema.safeParse(apiarySettings.seasons);
    if (parsed.success) return { seasons: parsed.data, source: 'apiary' };
  }

  return { seasons: [DEFAULT_FEEDING_SEASON], source: 'default' };
}

/** True when `date`'s calendar day falls inside the season (wrap-aware). */
export function isDateInSeason(
  season: Season,
  date: Date = new Date(),
): boolean {
  const year = date.getFullYear();
  const start = monthDayOrdinal(
    season.start.month,
    clampDayToMonth(season.start.month, season.start.day, year),
  );
  const end = monthDayOrdinal(
    season.end.month,
    clampDayToMonth(season.end.month, season.end.day, year),
  );
  const current = monthDayOrdinal(date.getMonth() + 1, date.getDate());
  if (start <= end) return current >= start && current <= end;
  return current >= start || current <= end;
}

/** The season containing `date`, if any. First match wins defensively. */
export function getActiveSeason(
  hiveSettings?: HiveSeasonSettings | null,
  apiarySettings?: ApiarySeasonSettings | null,
  date: Date = new Date(),
): Season | undefined {
  return getEffectiveSeasons(hiveSettings, apiarySettings).seasons.find(
    season => isDateInSeason(season, date),
  );
}

function positiveDays(value: number | null | undefined): number | undefined {
  return Number.isInteger(value) && (value ?? 0) > 0
    ? (value as number)
    : undefined;
}

/** Base (season-independent) inspection interval for a hive. */
export function getBaseInspectionFrequencyDays(
  hiveSettings?: HiveSeasonSettings | null,
): number {
  return (
    positiveDays(hiveSettings?.inspection?.frequencyDays) ??
    DEFAULT_INSPECTION_FREQUENCY_DAYS
  );
}

/**
 * Inspection interval in force on `date`: the active season's override when
 * set, otherwise the hive's base interval, otherwise 7 days.
 */
export function getEffectiveInspectionFrequencyDays(
  hiveSettings?: HiveSeasonSettings | null,
  apiarySettings?: ApiarySeasonSettings | null,
  date: Date = new Date(),
): number {
  return getInspectionFrequencyForSeasons(
    getEffectiveSeasons(hiveSettings, apiarySettings).seasons,
    getBaseInspectionFrequencyDays(hiveSettings),
    date,
  );
}

/**
 * Pure variant of {@link getEffectiveInspectionFrequencyDays} for callers that
 * evaluate many dates: resolve the seasons and base interval once, then call
 * this per date.
 */
export function getInspectionFrequencyForSeasons(
  seasons: Season[],
  baseDays: number,
  date: Date,
): number {
  const active = seasons.find(season => isDateInSeason(season, date));
  return positiveDays(active?.inspectionFrequencyDays) ?? baseDays;
}

/**
 * Interval that decides when the inspection after `lastInspection` is due:
 * the one in force the day after it. The overdue alert and the calendar
 * projection both use this, so a season starting or ending between the last
 * inspection and today cannot make them disagree.
 */
export function getInspectionDueFrequencyDays(
  hiveSettings: HiveSeasonSettings | null | undefined,
  apiarySettings: ApiarySeasonSettings | null | undefined,
  lastInspection: Date,
): number {
  const dayAfter = new Date(lastInspection);
  dayAfter.setDate(dayAfter.getDate() + 1);
  return getEffectiveInspectionFrequencyDays(
    hiveSettings,
    apiarySettings,
    dayAfter,
  );
}

/**
 * Start/end of the season occurrence relevant to `reference`: the occurrence
 * containing the date when active, otherwise the most recently completed one.
 * Day-of-month is clamped for short months (Feb 29 -> Feb 28).
 */
export function getSeasonWindow(
  season: Season,
  reference: Date = new Date(),
): SeasonWindow {
  const year = reference.getFullYear();
  const time = reference.getTime();
  const startThisYear = seasonDateInYear(
    season.start.month,
    season.start.day,
    year,
  );
  const endThisYear = seasonEndDateInYear(
    season.end.month,
    season.end.day,
    year,
  );
  const wraps =
    monthDayOrdinal(season.start.month, season.start.day) >
    monthDayOrdinal(season.end.month, season.end.day);

  if (!wraps) {
    if (time >= startThisYear.getTime() && time <= endThisYear.getTime()) {
      return { start: startThisYear, end: endThisYear };
    }
    if (time > endThisYear.getTime()) {
      return { start: startThisYear, end: endThisYear };
    }
    return {
      start: seasonDateInYear(season.start.month, season.start.day, year - 1),
      end: seasonEndDateInYear(season.end.month, season.end.day, year - 1),
    };
  }

  if (time >= startThisYear.getTime()) {
    return {
      start: startThisYear,
      end: seasonEndDateInYear(season.end.month, season.end.day, year + 1),
    };
  }
  if (time <= endThisYear.getTime()) {
    return {
      start: seasonDateInYear(season.start.month, season.start.day, year - 1),
      end: endThisYear,
    };
  }
  // In the gap between a wrapped season's end and its next start.
  return {
    start: seasonDateInYear(season.start.month, season.start.day, year - 1),
    end: endThisYear,
  };
}

/** True when the season is a feeding season with a target. */
export function isFeedingSeason(season: Season): boolean {
  return season.feeding.enabled && season.feeding.targetKg != null;
}

/** The feeding season containing `date`, if any. */
export function getActiveFeedingSeason(
  hiveSettings?: HiveSeasonSettings | null,
  apiarySettings?: ApiarySeasonSettings | null,
  date: Date = new Date(),
): Season | undefined {
  return getEffectiveSeasons(hiveSettings, apiarySettings).seasons.find(
    season => isFeedingSeason(season) && isDateInSeason(season, date),
  );
}

/**
 * The feeding season to show progress for: the active one, otherwise the one
 * whose window ended most recently.
 */
export function getRelevantFeedingSeason(
  hiveSettings?: HiveSeasonSettings | null,
  apiarySettings?: ApiarySeasonSettings | null,
  date: Date = new Date(),
): RelevantFeedingSeason | undefined {
  const feedingSeasons = getEffectiveSeasons(
    hiveSettings,
    apiarySettings,
  ).seasons.filter(isFeedingSeason);
  if (feedingSeasons.length === 0) return undefined;

  const active = feedingSeasons.find(season => isDateInSeason(season, date));
  if (active) {
    return {
      season: active,
      window: getSeasonWindow(active, date),
      isActive: true,
    };
  }

  let best: RelevantFeedingSeason | undefined;
  for (const season of feedingSeasons) {
    const window = getSeasonWindow(season, date);
    if (window.end.getTime() > date.getTime()) continue;
    if (!best || window.end.getTime() > best.window.end.getTime()) {
      best = { season, window, isActive: false };
    }
  }
  return best;
}
