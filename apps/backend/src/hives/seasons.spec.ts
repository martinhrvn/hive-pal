import {
  DEFAULT_FEEDING_SEASON,
  DEFAULT_INSPECTION_FREQUENCY_DAYS,
  LEGACY_AUTUMN_SEASON_ID,
  getActiveFeedingSeason,
  getEffectiveInspectionFrequencyDays,
  getEffectiveSchedule,
  getEffectiveSeasons,
  getRelevantFeedingSeason,
  getSeasonWindow,
  isDateInSeason,
  seasonFromLegacy,
  seasonListSchema,
  seasonSchema,
  type Season,
} from 'shared-schemas';

const SEASON_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_ID = '33333333-3333-4333-8333-333333333333';

const season = (overrides: Partial<Season> = {}): Season => ({
  id: SEASON_ID,
  name: 'Spring',
  start: { month: 3, day: 1 },
  end: { month: 5, day: 31 },
  inspectionFrequencyDays: null,
  feeding: { enabled: false, targetKg: null },
  ...overrides,
});

describe('season schema', () => {
  it('accepts leap day and rejects impossible calendar days', () => {
    expect(
      seasonSchema.safeParse(season({ start: { month: 2, day: 29 } })).success,
    ).toBe(true);
    expect(
      seasonSchema.safeParse(season({ start: { month: 4, day: 31 } })).success,
    ).toBe(false);
  });

  it('requires a target when feeding is enabled', () => {
    expect(
      seasonSchema.safeParse(
        season({ feeding: { enabled: true, targetKg: null } }),
      ).success,
    ).toBe(false);
    expect(
      seasonSchema.safeParse(
        season({ feeding: { enabled: true, targetKg: 12 } }),
      ).success,
    ).toBe(true);
  });

  it('rejects overlapping seasons, including wrapped ones', () => {
    expect(
      seasonListSchema.safeParse([
        season({ start: { month: 3, day: 1 }, end: { month: 5, day: 31 } }),
        season({
          id: OTHER_ID,
          start: { month: 5, day: 31 },
          end: { month: 7, day: 1 },
        }),
      ]).success,
    ).toBe(false);

    // Nov-Feb wraps the year and overlaps a January season.
    expect(
      seasonListSchema.safeParse([
        season({ start: { month: 11, day: 1 }, end: { month: 2, day: 28 } }),
        season({
          id: OTHER_ID,
          start: { month: 1, day: 1 },
          end: { month: 1, day: 31 },
        }),
      ]).success,
    ).toBe(false);
  });

  it('accepts adjacent seasons that only touch at the boundary', () => {
    expect(
      seasonListSchema.safeParse([
        season({ start: { month: 3, day: 1 }, end: { month: 5, day: 31 } }),
        season({
          id: OTHER_ID,
          start: { month: 6, day: 1 },
          end: { month: 8, day: 31 },
        }),
      ]).success,
    ).toBe(true);
  });

  it('allows an explicitly empty season list', () => {
    expect(seasonListSchema.safeParse([]).success).toBe(true);
  });
});

describe('getEffectiveSeasons', () => {
  it('prefers hive seasons over the apiary template', () => {
    const hiveSeasons = [season()];
    const apiarySeasons = [
      season({
        id: OTHER_ID,
        start: { month: 6, day: 1 },
        end: { month: 8, day: 31 },
      }),
    ];
    const result = getEffectiveSeasons(
      { seasons: hiveSeasons },
      { seasons: apiarySeasons },
    );
    expect(result.source).toBe('hive');
    expect(result.seasons).toEqual(hiveSeasons);
  });

  it('treats an explicit empty hive list as "no seasons"', () => {
    const result = getEffectiveSeasons(
      { seasons: [] },
      { seasons: [season()] },
    );
    expect(result.source).toBe('hive');
    expect(result.seasons).toEqual([]);
  });

  it('prefers legacy autumn feeding over the apiary template', () => {
    const result = getEffectiveSeasons(
      { autumnFeeding: { startMonth: 9, endMonth: 11, amountKg: 8 } },
      { seasons: [season()] },
    );
    expect(result.source).toBe('legacy');
    expect(result.seasons).toHaveLength(1);
    expect(result.seasons[0].id).toBe(LEGACY_AUTUMN_SEASON_ID);
    expect(result.seasons[0].start).toEqual({ month: 9, day: 1 });
    expect(result.seasons[0].end).toEqual({ month: 11, day: 30 });
    expect(result.seasons[0].feeding).toEqual({
      enabled: true,
      targetKg: 8,
    });
  });

  it('ignores the untouched legacy default in favour of the apiary template', () => {
    const result = getEffectiveSeasons(
      { autumnFeeding: { startMonth: 8, endMonth: 10, amountKg: 12 } },
      { seasons: [season()] },
    );
    expect(result.source).toBe('apiary');

    const noTemplate = getEffectiveSeasons(
      { autumnFeeding: { startMonth: 8, endMonth: 10, amountKg: 12 } },
      {},
    );
    expect(noTemplate.source).toBe('default');
    expect(noTemplate.seasons).toEqual([DEFAULT_FEEDING_SEASON]);
  });

  it('falls back to the apiary template, then the historical default', () => {
    expect(getEffectiveSeasons({}, { seasons: [season()] }).source).toBe(
      'apiary',
    );

    const fallback = getEffectiveSeasons({}, {});
    expect(fallback.source).toBe('default');
    expect(fallback.seasons).toEqual([DEFAULT_FEEDING_SEASON]);
  });

  it('degrades malformed hive seasons to the next source', () => {
    const result = getEffectiveSeasons(
      { seasons: [{ nope: true }] },
      { seasons: [season()] },
    );
    expect(result.source).toBe('apiary');
  });
});

describe('inspection frequency', () => {
  const base = { inspection: { frequencyDays: 10 } };
  const withOverride = season({ inspectionFrequencyDays: 3 });

  it('uses the active season override', () => {
    expect(
      getEffectiveInspectionFrequencyDays(
        { ...base, seasons: [withOverride] },
        null,
        new Date(2026, 3, 15),
      ),
    ).toBe(3);
  });

  it('falls back to the hive base interval outside seasons', () => {
    expect(
      getEffectiveInspectionFrequencyDays(
        { ...base, seasons: [withOverride] },
        null,
        new Date(2026, 7, 15),
      ),
    ).toBe(10);
  });

  it('uses the 7-day default when nothing is configured', () => {
    expect(getEffectiveInspectionFrequencyDays(null, null)).toBe(
      DEFAULT_INSPECTION_FREQUENCY_DAYS,
    );
  });
});

describe('getEffectiveSchedule', () => {
  const apiary = {
    seasons: [season({ inspectionFrequencyDays: 3 })],
    yearRound: { inspectionFrequencyDays: 14 },
  };

  it('inherits the apiary year-round interval with its seasons', () => {
    const schedule = getEffectiveSchedule(
      { inspection: { frequencyDays: 7 } },
      apiary,
    );
    expect(schedule.source).toBe('apiary');
    expect(schedule.baseInspectionFrequencyDays).toBe(14);
    expect(schedule.baseSource).toBe('apiary');
    expect(
      getEffectiveInspectionFrequencyDays(
        { inspection: { frequencyDays: 7 } },
        apiary,
        new Date(2026, 7, 15),
      ),
    ).toBe(14);
  });

  it('keeps the hive interval when the hive owns its seasons', () => {
    const schedule = getEffectiveSchedule(
      { inspection: { frequencyDays: 10 }, seasons: [] },
      apiary,
    );
    expect(schedule.source).toBe('hive');
    expect(schedule.baseInspectionFrequencyDays).toBe(10);
    expect(schedule.baseSource).toBe('hive');
  });

  it('falls back to the hive interval when the apiary sets none', () => {
    const schedule = getEffectiveSchedule(
      { inspection: { frequencyDays: 10 } },
      { seasons: apiary.seasons, yearRound: { inspectionFrequencyDays: null } },
    );
    expect(schedule.baseInspectionFrequencyDays).toBe(10);
    expect(schedule.baseSource).toBe('hive');
  });

  it('applies the apiary interval even without apiary seasons', () => {
    const schedule = getEffectiveSchedule(
      {},
      { yearRound: { inspectionFrequencyDays: 21 } },
    );
    expect(schedule.source).toBe('default');
    expect(schedule.baseInspectionFrequencyDays).toBe(21);
  });
});

describe('isDateInSeason / getSeasonWindow', () => {
  it('matches days inside a simple season', () => {
    const spring = season();
    expect(isDateInSeason(spring, new Date(2026, 2, 1))).toBe(true);
    expect(isDateInSeason(spring, new Date(2026, 4, 31))).toBe(true);
    expect(isDateInSeason(spring, new Date(2026, 5, 1))).toBe(false);
  });

  it('returns the active window for a simple season', () => {
    const window = getSeasonWindow(season(), new Date(2026, 3, 15));
    expect(window.start).toEqual(new Date(2026, 2, 1, 0, 0, 0, 0));
    expect(window.end).toEqual(new Date(2026, 4, 31, 23, 59, 59, 999));
  });

  it('returns the most recent completed window before the season starts', () => {
    const window = getSeasonWindow(season(), new Date(2026, 0, 15));
    expect(window.start).toEqual(new Date(2025, 2, 1, 0, 0, 0, 0));
    expect(window.end).toEqual(new Date(2025, 4, 31, 23, 59, 59, 999));
  });

  it('handles seasons that wrap the year', () => {
    const winter = season({
      start: { month: 11, day: 15 },
      end: { month: 2, day: 28 },
    });

    expect(isDateInSeason(winter, new Date(2026, 0, 10))).toBe(true);
    expect(isDateInSeason(winter, new Date(2026, 11, 20))).toBe(true);
    expect(isDateInSeason(winter, new Date(2026, 5, 1))).toBe(false);

    const january = getSeasonWindow(winter, new Date(2026, 0, 10));
    expect(january.start).toEqual(new Date(2025, 10, 15, 0, 0, 0, 0));
    expect(january.end).toEqual(new Date(2026, 1, 28, 23, 59, 59, 999));

    const december = getSeasonWindow(winter, new Date(2026, 11, 20));
    expect(december.start).toEqual(new Date(2026, 10, 15, 0, 0, 0, 0));
    expect(december.end).toEqual(new Date(2027, 1, 28, 23, 59, 59, 999));
  });

  it('clamps a Feb 29 season to Feb 28 in non-leap years', () => {
    const leap = season({
      start: { month: 2, day: 29 },
      end: { month: 2, day: 29 },
    });
    expect(isDateInSeason(leap, new Date(2026, 1, 28))).toBe(true);
    expect(isDateInSeason(leap, new Date(2026, 1, 27))).toBe(false);

    const window = getSeasonWindow(leap, new Date(2026, 1, 28));
    expect(window.start).toEqual(new Date(2026, 1, 28, 0, 0, 0, 0));
  });
});

describe('feeding seasons', () => {
  const autumn = season({
    id: OTHER_ID,
    start: { month: 8, day: 1 },
    end: { month: 10, day: 31 },
    feeding: { enabled: true, targetKg: 12 },
  });

  it('finds the active feeding season', () => {
    expect(
      getActiveFeedingSeason({ seasons: [autumn] }, null, new Date(2026, 8, 15))
        ?.id,
    ).toBe(OTHER_ID);
    expect(
      getActiveFeedingSeason(
        { seasons: [autumn] },
        null,
        new Date(2026, 11, 15),
      ),
    ).toBeUndefined();
  });

  it('falls back to the most recently completed feeding season', () => {
    const relevant = getRelevantFeedingSeason(
      { seasons: [autumn] },
      null,
      new Date(2026, 11, 15),
    );
    expect(relevant?.season.id).toBe(OTHER_ID);
    expect(relevant?.isActive).toBe(false);
    expect(relevant?.window.start).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0));
    expect(relevant?.window.end).toEqual(
      new Date(2026, 9, 31, 23, 59, 59, 999),
    );
  });

  it('has no feeding season when none is marked as feeding', () => {
    expect(
      getRelevantFeedingSeason({ seasons: [season()] }, null, new Date()),
    ).toBeUndefined();
  });
});

describe('seasonFromLegacy', () => {
  it('expands month-only legacy values to full month days', () => {
    expect(
      seasonFromLegacy({ startMonth: 8, endMonth: 10, amountKg: 12 }),
    ).toMatchObject({
      id: LEGACY_AUTUMN_SEASON_ID,
      start: { month: 8, day: 1 },
      end: { month: 10, day: 31 },
      feeding: { enabled: true, targetKg: 12 },
    });
  });

  it('falls back to the default for invalid legacy data', () => {
    expect(
      seasonFromLegacy({ startMonth: 13, endMonth: 10, amountKg: 12 }),
    ).toEqual(DEFAULT_FEEDING_SEASON);
  });
});
