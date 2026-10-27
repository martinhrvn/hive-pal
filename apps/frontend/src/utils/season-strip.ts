import {
  daysInMonth,
  isFeedingSeason,
  monthDayOrdinal,
  type Season,
} from 'shared-schemas';

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

/**
 * What a season does, which is what its colour on the strip encodes. A season
 * without inspections reads as closed even when it also tracks feeding.
 */
export type SeasonRole = 'feeding' | 'paused' | 'inspect';

/** A season's role, or `yearRound` for days no season covers. */
export type StripRole = SeasonRole | 'yearRound';

export function seasonRole(season: Season): SeasonRole {
  if (season.inspectionsPaused) return 'paused';
  return isFeedingSeason(season) ? 'feeding' : 'inspect';
}

export interface InspectionTick {
  index: number;
  role: StripRole;
  /** Season the tick belongs to; `undefined` on year-round days. */
  seasonId?: string;
}

/**
 * Inspections implied by each stretch's interval, as strip day indexes. The
 * real schedule counts from the last inspection; this only shows the rhythm,
 * so ticks start half an interval into each stretch. A stretch across the new
 * year is walked once and keeps its spacing over Dec 31.
 */
export function buildInspectionTicks(
  segments: YearStripSegment[],
  baseFrequencyDays?: number,
): InspectionTick[] {
  const ticks: InspectionTick[] = [];
  const walked = new Set<string>();

  for (const segment of segments) {
    const stretch = stretchOf(segment, baseFrequencyDays);
    if (!stretch || walked.has(stretch.key)) continue;
    walked.add(stretch.key);

    const { start, end, interval, role, seasonId } = stretch;
    const length =
      end >= start ? end - start + 1 : STRIP_DAYS - start + end + 1;
    for (
      let offset = Math.floor(interval / 2);
      offset < length;
      offset += interval
    ) {
      ticks.push({ index: (start + offset) % STRIP_DAYS, role, seasonId });
    }
  }
  return ticks;
}

/** The whole stretch a segment belongs to, or `null` when it has no rhythm. */
function stretchOf(segment: YearStripSegment, baseFrequencyDays?: number) {
  if (segment.kind === 'yearRound') {
    if (!baseFrequencyDays) return null;
    return {
      key: `gap-${segment.gapStart}`,
      start: segment.gapStart,
      end: segment.gapEnd,
      interval: baseFrequencyDays,
      role: 'yearRound' as const,
      seasonId: undefined,
    };
  }
  const { season } = segment;
  const interval = season.inspectionFrequencyDays ?? baseFrequencyDays;
  if (season.inspectionsPaused || !interval) return null;
  return {
    key: `season-${season.id}`,
    start: stripDayIndex(season.start.month, season.start.day),
    end: stripDayIndex(season.end.month, season.end.day),
    interval,
    role: seasonRole(season),
    seasonId: season.id,
  };
}

type MonthDay = { month: number; day: number };
type MonthDayRange = { start: MonthDay; end: MonthDay };
/** Inclusive strip day indexes; `start > end` wraps across the new year. */
type Span = { start: number; end: number };

const wrapIndex = (index: number) =>
  ((index % STRIP_DAYS) + STRIP_DAYS) % STRIP_DAYS;

function spanOf(range: MonthDayRange): Span {
  return {
    start: stripDayIndex(range.start.month, range.start.day),
    end: stripDayIndex(range.end.month, range.end.day),
  };
}

function rangeOf(span: Span): MonthDayRange {
  return {
    start: stripIndexToMonthDay(span.start),
    end: stripIndexToMonthDay(span.end),
  };
}

function spanCovers(span: Span, index: number): boolean {
  return span.start <= span.end
    ? index >= span.start && index <= span.end
    : index >= span.start || index <= span.end;
}

function spanLength(span: Span): number {
  return wrapIndex(span.end - span.start) + 1;
}

/** Two stretches of the year meet when one holds the other's first day. */
function spansOverlap(a: Span, b: Span): boolean {
  return spanCovers(a, b.start) || spanCovers(b, a.start);
}

/** Whether a day of the year falls in the range, across the new year too. */
export function rangeCovers(range: MonthDayRange, day: MonthDay): boolean {
  return spanCovers(spanOf(range), stripDayIndex(day.month, day.day));
}

/**
 * The first stretch of days two overlapping ranges share, or `undefined` when
 * they don't overlap.
 */
export function sharedRange(
  a: MonthDayRange,
  b: MonthDayRange,
): MonthDayRange | undefined {
  const spanA = spanOf(a);
  const spanB = spanOf(b);
  if (!spansOverlap(spanA, spanB)) return undefined;
  const start = spanCovers(spanA, spanB.start) ? spanB.start : spanA.start;
  const length = Math.min(
    wrapIndex(spanA.end - start),
    wrapIndex(spanB.end - start),
  );
  return rangeOf({ start, end: wrapIndex(start + length) });
}

export interface ShortenedSeason {
  index: number;
  start: MonthDay;
  end: MonthDay;
}

/**
 * Give season `index` the days in `range`, shortening each season it now
 * overlaps from the side it overlaps. Returns the shortened seasons (empty
 * when nothing clashes), or `null` when a season would be covered whole or
 * cut in two, which shortening cannot fix.
 */
export function claimSeasonDays(
  seasons: MonthDayRange[],
  index: number,
  range: MonthDayRange,
): ShortenedSeason[] | null {
  const claimed = spanOf(range);
  const shortened: ShortenedSeason[] = [];

  for (const [otherIndex, other] of seasons.entries()) {
    if (otherIndex === index) continue;
    const span = spanOf(other);
    if (!spansOverlap(claimed, span)) continue;

    const startInside = spanCovers(claimed, span.start);
    const endInside = spanCovers(claimed, span.end);
    // Both ends inside: covered whole. Neither: the claim sits in its middle.
    if (startInside === endInside) return null;

    const next = startInside
      ? { start: wrapIndex(claimed.end + 1), end: span.end }
      : { start: span.start, end: wrapIndex(claimed.start - 1) };
    if (spanLength(next) >= spanLength(span) || spansOverlap(claimed, next)) {
      return null;
    }
    shortened.push({ index: otherIndex, ...rangeOf(next) });
  }
  return shortened;
}

/**
 * The longest stretch no season covers, for a new season to fill, or
 * `undefined` when there are no seasons yet or every day is taken.
 */
export function longestFreeRange(seasons: Season[]): MonthDayRange | undefined {
  if (seasons.length === 0) return undefined;
  let longest: Span | undefined;
  for (const segment of buildYearStripSegments(seasons)) {
    if (segment.kind !== 'yearRound') continue;
    const gap = { start: segment.gapStart, end: segment.gapEnd };
    if (!longest || spanLength(gap) > spanLength(longest)) longest = gap;
  }
  return longest && rangeOf(longest);
}

/** Seasons in calendar order of their start date (Jan → Dec). */
export function sortSeasonsByStart<T extends Season>(seasons: T[]): T[] {
  return [...seasons].sort(
    (a, b) =>
      monthDayOrdinal(a.start.month, a.start.day) -
      monthDayOrdinal(b.start.month, b.start.day),
  );
}
