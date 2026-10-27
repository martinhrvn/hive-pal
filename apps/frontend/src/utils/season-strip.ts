import { daysInMonth, type Season } from 'shared-schemas';

/** Days in the leap reference year, so Feb 29 has a slot on the strip. */
export const STRIP_DAYS = 366;
const REFERENCE_YEAR = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Zero-based day of the (leap) reference year for a month/day pair. */
export function stripDayIndex(month: number, day: number): number {
  const clamped = Math.min(day, daysInMonth(month, REFERENCE_YEAR));
  return Math.round(
    (Date.UTC(REFERENCE_YEAR, month - 1, clamped) -
      Date.UTC(REFERENCE_YEAR, 0, 1)) /
      DAY_MS,
  );
}

/** Inverse of {@link stripDayIndex}: a month/day pair for a strip day index. */
export function stripIndexToMonthDay(index: number): {
  month: number;
  day: number;
} {
  const date = new Date(Date.UTC(REFERENCE_YEAR, 0, 1) + index * DAY_MS);
  return { month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export type YearStripSegment =
  | {
      kind: 'season';
      season: Season;
      seasonIndex: number;
      start: number;
      end: number;
    }
  | {
      kind: 'yearRound';
      start: number;
      end: number;
      /**
       * The whole uncovered stretch this segment belongs to. A gap across the
       * new year (Nov – Feb) is drawn at both ends of the strip; both halves
       * share it, and `gapStart > gapEnd` marks the wrap.
       */
      gapStart: number;
      gapEnd: number;
    };

/**
 * Lay the seasons out on one calendar year. A season that wraps the year
 * (Nov – Feb) becomes two segments; days no season covers become year-round
 * segments, and a gap across the new year keeps its full extent on both
 * halves. Segments are sorted, inclusive and never overlap for a valid list.
 */
export function buildYearStripSegments(seasons: Season[]): YearStripSegment[] {
  const seasonSegments: YearStripSegment[] = seasons.flatMap(
    (season, seasonIndex) => {
      const start = stripDayIndex(season.start.month, season.start.day);
      const end = stripDayIndex(season.end.month, season.end.day);
      if (start <= end) {
        return [{ kind: 'season' as const, season, seasonIndex, start, end }];
      }
      return [
        { kind: 'season' as const, season, seasonIndex, start: 0, end },
        {
          kind: 'season' as const,
          season,
          seasonIndex,
          start,
          end: STRIP_DAYS - 1,
        },
      ];
    },
  );
  seasonSegments.sort((a, b) => a.start - b.start);

  const segments: YearStripSegment[] = [];
  let cursor = 0;
  for (const segment of seasonSegments) {
    if (segment.start > cursor) {
      segments.push(yearRound(cursor, segment.start - 1));
    }
    segments.push(segment);
    cursor = Math.max(cursor, segment.end + 1);
  }
  if (cursor < STRIP_DAYS) {
    segments.push(yearRound(cursor, STRIP_DAYS - 1));
  }

  // Dec 31 and Jan 1 are neighbours: gaps touching both ends of the strip are
  // one stretch across the new year.
  const first = segments[0];
  const last = segments.at(-1);
  if (
    first?.kind === 'yearRound' &&
    last?.kind === 'yearRound' &&
    first !== last
  ) {
    first.gapStart = last.gapStart = last.start;
    first.gapEnd = last.gapEnd = first.end;
  }
  return segments;
}

function yearRound(start: number, end: number): YearStripSegment {
  return { kind: 'yearRound', start, end, gapStart: start, gapEnd: end };
}
