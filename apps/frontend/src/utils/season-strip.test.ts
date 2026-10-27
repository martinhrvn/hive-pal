import { describe, expect, it } from 'vitest';
import type { Season } from 'shared-schemas';
import {
  STRIP_DAYS,
  buildYearStripSegments,
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
