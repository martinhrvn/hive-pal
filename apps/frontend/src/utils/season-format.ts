import type { TFunction } from 'i18next';
import { daysInMonth, isBuiltInSeasonId } from 'shared-schemas';

/** Localized, compact label for a season's month/day range (e.g. "Mar 1 – May 31"). */
export function formatSeasonRange(
  season: {
    start: { month: number; day: number };
    end: { month: number; day: number };
  },
  locale: string,
): string {
  // A leap reference year keeps Feb 29 displayable; runtimes clamp it.
  const start = new Date(
    2000,
    season.start.month - 1,
    Math.min(season.start.day, daysInMonth(season.start.month, 2000)),
  );
  const end = new Date(
    2000,
    season.end.month - 1,
    Math.min(season.end.day, daysInMonth(season.end.month, 2000)),
  );
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

/** The season's user-given name, or `undefined` for migrated/default seasons. */
export function getSeasonLabel(season: { name?: string }): string | undefined {
  const name = season.name?.trim();
  return name ? name : undefined;
}

/**
 * Display name for a season: its own name, "Autumn feeding" for the seasons
 * Hive Pal synthesized from legacy/default settings, otherwise a generic
 * "Unnamed season".
 */
export function getSeasonDisplayName(
  season: { id?: string; name?: string },
  t: TFunction,
): string {
  return (
    getSeasonLabel(season) ??
    (isBuiltInSeasonId(season.id)
      ? t('common:season.unnamed')
      : t('common:season.untitled'))
  );
}

/** Localized labels for the twelve months, narrow ("J") and short ("Jan"). */
export function formatMonthLabels(
  locale: string,
): { month: number; narrow: string; short: string }[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(2000, index, 1);
    return {
      month: index + 1,
      narrow: date.toLocaleDateString(locale, { month: 'narrow' }),
      short: date.toLocaleDateString(locale, { month: 'short' }),
    };
  });
}

/** Localized month and day, e.g. "October 27". */
export function formatMonthDay(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
}
