import type { Season } from 'shared-schemas';
import type { HiveContext } from '../interfaces';
import { InspectionOverdueChecker } from './inspection-overdue.checker';

const NOW = new Date(2026, 3, 15, 12, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

const SEASON_ID = '22222222-2222-4222-8222-222222222222';

const spring = (inspectionFrequencyDays: number): Season => ({
  id: SEASON_ID,
  name: 'Spring',
  start: { month: 3, day: 1 },
  end: { month: 5, day: 31 },
  inspectionFrequencyDays,
  feeding: { enabled: false, targetKg: null },
});

// Nov 1 - Feb 28, wrapping the year, with no inspections.
const winter: Season = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Winter',
  start: { month: 11, day: 1 },
  end: { month: 2, day: 28 },
  inspectionFrequencyDays: null,
  inspectionsPaused: true,
  feeding: { enabled: false, targetKg: null },
};

const hive = (overrides: Partial<HiveContext> = {}): HiveContext => ({
  hiveId: 'hive-1',
  name: 'Hive 01',
  settings: { inspection: { frequencyDays: 7 } },
  status: 'ACTIVE',
  lastInspectionDate: daysAgo(5),
  ...overrides,
});

describe('InspectionOverdueChecker', () => {
  const checker = new InspectionOverdueChecker();
  const check = (subject: HiveContext) =>
    checker.checkHive(subject, {
      userId: 'user-1',
      apiaryId: 'apiary-1',
      currentTime: NOW,
    });

  it('does not flag a hive inspected within the base interval', () => {
    expect(check(hive())).toEqual([]);
  });

  it('flags a hive past the base interval', () => {
    const [issue] = check(hive({ lastInspectionDate: daysAgo(10) }));
    expect(issue?.type).toBe('inspection_overdue');
    expect(issue?.metadata?.expectedFrequencyDays).toBe(7);
  });

  it('uses an active season override', () => {
    const [issue] = check(
      hive({
        settings: { inspection: { frequencyDays: 7 }, seasons: [spring(3)] },
      }),
    );
    expect(issue?.metadata?.expectedFrequencyDays).toBe(3);
  });

  it('uses a season override inherited from the apiary template', () => {
    const [issue] = check(
      hive({
        settings: { inspection: { frequencyDays: 7 } },
        apiarySettings: { seasons: [spring(3)] },
      }),
    );
    expect(issue?.metadata?.expectedFrequencyDays).toBe(3);
  });

  it('falls back to the base interval outside the season', () => {
    const subject = hive({
      settings: { inspection: { frequencyDays: 7 }, seasons: [spring(3)] },
      lastInspectionDate: new Date(2026, 7, 10),
    });
    // Five days ago on Aug 15: within the base 7 days, but it would be overdue
    // if the spring override (3 days) leaked outside its window.
    expect(
      checker.checkHive(subject, {
        userId: 'u',
        apiaryId: 'a',
        currentTime: new Date(2026, 7, 15),
      }),
    ).toEqual([]);
  });

  it('keeps the interval in force after the last inspection when a season starts', () => {
    // Last inspected Feb 26 on the 14-day base; spring (3 days) starts Mar 1.
    // The calendar puts the next inspection on Mar 12, so Mar 5 is not overdue.
    const subject = hive({
      settings: { inspection: { frequencyDays: 14 }, seasons: [spring(3)] },
      lastInspectionDate: new Date(2026, 1, 26),
    });
    expect(
      checker.checkHive(subject, {
        userId: 'u',
        apiaryId: 'a',
        currentTime: new Date(2026, 2, 5),
      }),
    ).toEqual([]);
  });

  describe('season without inspections', () => {
    const at = (subject: HiveContext, currentTime: Date) =>
      checker.checkHive(subject, { userId: 'u', apiaryId: 'a', currentTime });
    const wintering = (lastInspectionDate: Date | null) =>
      hive({
        settings: { inspection: { frequencyDays: 7 }, seasons: [winter] },
        lastInspectionDate,
      });

    it('does not flag a hive during the season', () => {
      expect(
        at(wintering(new Date(2026, 8, 1)), new Date(2026, 11, 1)),
      ).toEqual([]);
      expect(at(wintering(null), new Date(2026, 11, 1))).toEqual([]);
    });

    it('flags the hive once the season has ended', () => {
      const subject = wintering(new Date(2026, 9, 30));
      expect(at(subject, new Date(2027, 2, 1, 12))).toEqual([]);
      const [issue] = at(subject, new Date(2027, 2, 2, 12));
      expect(issue?.type).toBe('inspection_overdue');
      expect(issue?.severity).toBe('LOW');
    });
  });
});
