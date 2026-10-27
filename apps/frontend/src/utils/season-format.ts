import { daysInMonth } from 'shared-schemas';

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
