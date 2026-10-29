import { describe, expect, it } from 'vitest';
import type { Season } from 'shared-schemas';
import {
  STRIP_DAYS,
  buildInspectionTicks,
  buildYearStripSegments,
  claimSeasonDays,
  longestFreeRange,
  sharedRange,
  sortSeasonsByStart,
  stripDayIndex,
} from './season-strip';

const season = (
  id: string,
  start: [number, number],
  end: [number, number],
): Season => ({
  id,
  name: id,
  start: { month: start[0], day: start[1] },
  end: { month: end[0], day: end[1] },
  inspectionFrequencyDays: null,
  feeding: { enabled: false, targetKg: null },
});

describe('stripDayIndex', () => {
  it('maps month/day onto the leap reference year', () => {
    expect(stripDayIndex(1, 1)).toBe(0);
    expect(stripDayIndex(2, 29)).toBe(59);
    expect(stripDayIndex(12, 31)).toBe(STRIP_DAYS - 1);
  });
});

describe('buildYearStripSegments', () => {
  it('is one year-round segment without seasons', () => {
    expect(buildYearStripSegments([])).toEqual([
      {
        kind: 'yearRound',
        start: 0,
        end: STRIP_DAYS - 1,
        gapStart: 0,
        gapEnd: STRIP_DAYS - 1,
      },
    ]);
  });

  it('fills the gaps around seasons with year-round segments', () => {
    const segments = buildYearStripSegments([
      season('autumn', [8, 1], [10, 31]),
      season('spring', [3, 1], [5, 31]),
    ]);
    expect(segments.map(segment => segment.kind)).toEqual([
      'yearRound',
      'season',
      'yearRound',
      'season',
      'yearRound',
    ]);
    // Contiguous and covering the whole year.
    for (let i = 1; i < segments.length; i += 1) {
      expect(segments[i].start).toBe(segments[i - 1].end + 1);
    }
    expect(segments.at(-1)?.end).toBe(STRIP_DAYS - 1);
  });

  it('splits a season that wraps the year', () => {
    const segments = buildYearStripSegments([
      season('winter', [11, 15], [2, 28]),
    ]);
    expect(segments).toMatchObject([
      { kind: 'season', start: 0, end: stripDayIndex(2, 28) },
      { kind: 'yearRound' },
      { kind: 'season', start: stripDayIndex(11, 15), end: STRIP_DAYS - 1 },
    ]);
  });

  it('joins the gaps at both ends into one stretch across the new year', () => {
    const segments = buildYearStripSegments([
      season('autumn', [8, 1], [9, 30]),
      season('spring', [4, 1], [5, 31]),
    ]);
    const wrapped = {
      gapStart: stripDayIndex(10, 1),
      gapEnd: stripDayIndex(3, 31),
    };
    expect(segments[0]).toMatchObject({
      kind: 'yearRound',
      start: 0,
      ...wrapped,
    });
    expect(segments.at(-1)).toMatchObject({
      kind: 'yearRound',
      end: STRIP_DAYS - 1,
      ...wrapped,
    });
    // Gaps in the middle of the year stay their own.
    expect(segments[2]).toMatchObject({
      kind: 'yearRound',
      gapStart: stripDayIndex(6, 1),
      gapEnd: stripDayIndex(7, 31),
    });
  });
});

describe('buildInspectionTicks', () => {
  const withInterval = (s: Season, days: number | null): Season => ({
    ...s,
    inspectionFrequencyDays: days,
  });
  const ticksFor = (seasons: Season[], base?: number) =>
    buildInspectionTicks(buildYearStripSegments(seasons), base);

  it('spaces ticks by each season interval', () => {
    const spring = withInterval(season('spring', [3, 1], [5, 31]), 5);
    const ticks = ticksFor([spring], 30).filter(t => t.seasonId === 'spring');
    // 92 days at 5-day spacing, starting half an interval in (day 2 … 87).
    expect(ticks).toHaveLength(18);
    expect(ticks[0].index).toBe(stripDayIndex(3, 1) + 2);
    expect(ticks[1].index - ticks[0].index).toBe(5);
    expect(ticks[0].role).toBe('inspect');
  });

  it('falls back to the base interval, including on year-round days', () => {
    const ticks = ticksFor([season('spring', [3, 1], [5, 31])], 10);
    expect(ticks.some(t => t.seasonId === 'spring')).toBe(true);
    expect(ticks.some(t => t.role === 'yearRound')).toBe(true);
  });

  it('draws no ticks in a season without inspections', () => {
    const winter = {
      ...season('winter', [11, 1], [2, 28]),
      inspectionsPaused: true,
    };
    expect(ticksFor([winter], 7).filter(t => t.seasonId === 'winter')).toEqual(
      [],
    );
  });

  it('keeps the rhythm of a season across the new year', () => {
    const winter = withInterval(season('winter', [12, 20], [1, 20]), 10);
    const indexes = ticksFor([winter])
      .filter(t => t.seasonId === 'winter')
      .map(t => t.index);
    // Dec 25, Jan 4 (wrapped), Jan 14: one walk, not one per half.
    expect(indexes).toEqual([
      stripDayIndex(12, 25),
      stripDayIndex(1, 4),
      stripDayIndex(1, 14),
    ]);
  });

  it('has no rhythm when the interval is unknown', () => {
    expect(ticksFor([season('spring', [3, 1], [5, 31])])).toEqual([]);
  });

  it('ignores an interval that cannot drive the strip', () => {
    // A negative step used to loop forever while the field was being edited.
    for (const days of [-5, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
      const spring = withInterval(season('spring', [3, 1], [5, 31]), days);
      expect(
        ticksFor([spring], 7).filter(t => t.seasonId === 'spring'),
      ).toEqual([]);
    }
  });

  it('does not step year-round ticks by an invalid base interval', () => {
    expect(ticksFor([season('spring', [3, 1], [5, 31])], -5)).toEqual([]);
  });

  it('marks feeding seasons', () => {
    const autumn: Season = {
      ...withInterval(season('autumn', [8, 1], [10, 31]), 14),
      feeding: { enabled: true, targetKg: 12 },
    };
    expect(ticksFor([autumn])[0].role).toBe('feeding');
  });
});

describe('sortSeasonsByStart', () => {
  it('orders seasons from January to December', () => {
    const sorted = sortSeasonsByStart([
      season('winter', [11, 1], [2, 28]),
      season('spring', [3, 1], [5, 31]),
      season('late-winter', [1, 15], [2, 10]),
    ]);
    expect(sorted.map(s => s.id)).toEqual(['late-winter', 'spring', 'winter']);
  });
});

const md = (month: number, day: number) => ({ month, day });

describe('claimSeasonDays', () => {
  const spring = season('spring', [3, 1], [5, 31]);
  const summer = season('summer', [6, 1], [8, 31]);
  const winter = season('winter', [11, 15], [2, 15]);

  it('changes nothing when the days are free', () => {
    expect(
      claimSeasonDays([spring, summer], 0, {
        start: md(3, 1),
        end: md(5, 15),
      }),
    ).toEqual([]);
  });

  it('shortens the season it reaches into from that side', () => {
    // Spring ends later, so summer starts the day after.
    expect(
      claimSeasonDays([spring, summer], 0, {
        start: md(3, 1),
        end: md(6, 20),
      }),
    ).toEqual([{ index: 1, start: md(6, 21), end: md(8, 31) }]);
    // Spring starts earlier, so winter ends the day before, across the year.
    expect(
      claimSeasonDays([spring, winter], 0, {
        start: md(2, 1),
        end: md(5, 31),
      }),
    ).toEqual([{ index: 1, start: md(11, 15), end: md(1, 31) }]);
  });

  it('refuses to cover a season whole or cut one in two', () => {
    expect(
      claimSeasonDays([spring, summer], 0, {
        start: md(3, 1),
        end: md(9, 30),
      }),
    ).toBeNull();
    expect(
      claimSeasonDays([spring, summer], 0, {
        start: md(7, 1),
        end: md(7, 10),
      }),
    ).toBeNull();
  });
});

describe('sharedRange', () => {
  it('finds the days two seasons share, across the new year too', () => {
    expect(
      sharedRange(
        { start: md(3, 1), end: md(5, 31) },
        { start: md(5, 15), end: md(7, 1) },
      ),
    ).toEqual({ start: md(5, 15), end: md(5, 31) });
    expect(
      sharedRange(
        { start: md(11, 15), end: md(2, 15) },
        { start: md(2, 1), end: md(3, 31) },
      ),
    ).toEqual({ start: md(2, 1), end: md(2, 15) });
    expect(
      sharedRange(
        { start: md(3, 1), end: md(5, 31) },
        { start: md(6, 1), end: md(7, 1) },
      ),
    ).toBeUndefined();
  });
});

describe('longestFreeRange', () => {
  it('picks the longest stretch no season covers', () => {
    expect(
      longestFreeRange([
        season('spring', [3, 1], [5, 31]),
        season('winter', [11, 15], [2, 15]),
      ]),
    ).toEqual({ start: md(6, 1), end: md(11, 14) });
    expect(longestFreeRange([])).toBeUndefined();
  });
});
