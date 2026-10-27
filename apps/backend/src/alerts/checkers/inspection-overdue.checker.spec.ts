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
});
