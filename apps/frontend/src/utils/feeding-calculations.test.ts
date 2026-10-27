import { describe, expect, it } from 'vitest';
import type { ActionResponse, Season } from 'shared-schemas';
import {
  calculateFeedingTotals,
  calculateFeedingTotalsInWindow,
  getFeedingSeasonProgress,
} from './feeding-calculations';

const SEASON_ID = '22222222-2222-4222-8222-222222222222';

const autumn: Season = {
  id: SEASON_ID,
  name: 'Winter prep',
  start: { month: 8, day: 1 },
  end: { month: 10, day: 31 },
  inspectionFrequencyDays: null,
  feeding: { enabled: true, targetKg: 12 },
};

const feeding = (
  id: string,
  date: Date,
  sugarG: number,
  overrides: Record<string, unknown> = {},
): ActionResponse =>
  ({
    id,
    hiveId: 'hive-1',
    inspectionId: null,
    type: 'FEEDING',
    date: date.toISOString(),
    notes: null,
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
    details: {
      type: 'FEEDING',
      feedType: 'SYRUP',
      amount: 2,
      unit: 'L',
      concentration: '2:1',
      sugarG,
      ...overrides,
    },
  }) as unknown as ActionResponse;

describe('calculateFeedingTotals', () => {
  it('separates current-year totals from all-time totals', () => {
    const year = new Date().getFullYear();
    const actions = [
      feeding('a', new Date(year, 8, 10), 2000),
      feeding('b', new Date(year - 1, 8, 10), 3000),
    ];

    const totals = calculateFeedingTotals(actions);
    expect(totals.currentYearSugarKg).toBeCloseTo(2);
    expect(totals.totalSugarKg).toBeCloseTo(5);
    expect(totals.currentYearSyrupLiters).toBeCloseTo(2);
    expect(totals.totalSyrupLiters).toBeCloseTo(4);
  });

  it('ignores non-feeding actions', () => {
    const actions = [
      feeding('a', new Date(2026, 8, 10), 2000),
      {
        ...feeding('b', new Date(2026, 8, 10), 0),
        type: 'NOTE',
      } as unknown as ActionResponse,
    ];
    expect(calculateFeedingTotals(actions).totalSugarKg).toBeCloseTo(2);
  });

  it('treats a legacy syrup record without a unit as liters', () => {
    const legacy = feeding('a', new Date(2026, 8, 10), 0, {
      unit: '',
      sugarG: undefined,
      concentration: '1:1',
    });
    const totals = calculateFeedingTotals([legacy]);
    expect(totals.totalSyrupLiters).toBeCloseTo(2);
    expect(totals.totalSugarKg).toBeGreaterThan(0);
  });
});

describe('calculateFeedingTotalsInWindow', () => {
  it('only counts feedings inside the inclusive window', () => {
    const actions = [
      feeding('before', new Date(2026, 6, 31), 1000),
      feeding('start', new Date(2026, 7, 1), 2000),
      feeding('end', new Date(2026, 9, 31), 3000),
      feeding('after', new Date(2026, 10, 1), 4000),
    ];

    const totals = calculateFeedingTotalsInWindow(
      actions,
      new Date(2026, 7, 1, 0, 0, 0, 0),
      new Date(2026, 9, 31, 23, 59, 59, 999),
    );
    expect(totals.sugarKg).toBeCloseTo(5);
    expect(totals.syrupLiters).toBeCloseTo(4);
  });
});

describe('getFeedingSeasonProgress', () => {
  it('tracks progress inside the active feeding season', () => {
    const actions = [
      feeding('inside', new Date(2026, 8, 10), 2000),
      feeding('outside', new Date(2026, 6, 10), 5000),
    ];

    const progress = getFeedingSeasonProgress(
      actions,
      { seasons: [autumn] },
      null,
      new Date(2026, 8, 15),
    );

    expect(progress).not.toBeNull();
    expect(progress?.season.id).toBe(SEASON_ID);
    expect(progress?.isActive).toBe(true);
    expect(progress?.source).toBe('hive');
    expect(progress?.sugarKg).toBeCloseTo(2);
    expect(progress?.targetKg).toBe(12);
    expect(progress?.percentage).toBeCloseTo((2 / 12) * 100);
    expect(progress?.remainingKg).toBeCloseTo(10);
  });

  it('falls back to the most recently completed feeding season', () => {
    const actions = [feeding('inside', new Date(2026, 8, 10), 2000)];
    const progress = getFeedingSeasonProgress(
      actions,
      { seasons: [autumn] },
      null,
      new Date(2026, 11, 15),
    );
    expect(progress?.isActive).toBe(false);
    expect(progress?.sugarKg).toBeCloseTo(2);
  });

  it('uses an apiary template and reports its source', () => {
    const progress = getFeedingSeasonProgress(
      [feeding('inside', new Date(2026, 8, 10), 2000)],
      null,
      { seasons: [autumn] },
      new Date(2026, 8, 15),
    );
    expect(progress?.source).toBe('apiary');
    expect(progress?.sugarKg).toBeCloseTo(2);
  });

  it('returns null when there is no feeding season', () => {
    const progress = getFeedingSeasonProgress(
      [feeding('inside', new Date(2026, 8, 10), 2000)],
      {
        seasons: [
          {
            ...autumn,
            feeding: { enabled: false, targetKg: null },
          },
        ],
      },
      null,
      new Date(2026, 8, 15),
    );
    expect(progress).toBeNull();
  });
});
