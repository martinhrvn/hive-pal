import type { Season } from 'shared-schemas';
import {
  buildScheduledInspectionEvents,
  type InspectionScheduleHive,
} from './inspection-schedule';

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

const hive = (
  overrides: Partial<InspectionScheduleHive> = {},
): InspectionScheduleHive => ({
  hiveId: 'hive-1',
  name: 'Hive 01',
  status: 'ACTIVE',
  settings: { inspection: { frequencyDays: 7 } },
  lastInspectionDate: new Date(2026, 3, 1),
  ...overrides,
});

describe('buildScheduledInspectionEvents', () => {
  it('projects inspections at the base interval', () => {
    const events = buildScheduledInspectionEvents(
      [hive()],
      new Date(2026, 3, 5),
      2,
    );
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      summary: 'Hive 01 Inspection',
      dtstart: new Date(2026, 3, 8),
      isAllDay: true,
    });
    expect(events[1].dtstart).toEqual(new Date(2026, 3, 15));
  });

  it('uses a season interval override for the first due date', () => {
    const events = buildScheduledInspectionEvents(
      [
        hive({
          lastInspectionDate: new Date(2026, 2, 1),
          settings: {
            inspection: { frequencyDays: 7 },
            seasons: [spring(3)],
          },
        }),
      ],
      new Date(2026, 2, 2),
      1,
    );
    expect(events[0].dtstart).toEqual(new Date(2026, 2, 4));
    expect(events[1].dtstart).toEqual(new Date(2026, 2, 7));
  });

  it('inherits a season interval from the apiary template', () => {
    const events = buildScheduledInspectionEvents(
      [
        hive({
          lastInspectionDate: new Date(2026, 2, 1),
          apiarySettings: { seasons: [spring(3)] },
        }),
      ],
      new Date(2026, 2, 2),
      1,
    );
    expect(events[0].dtstart).toEqual(new Date(2026, 2, 4));
  });

  it('emits one overdue event today and projects forward from today', () => {
    const events = buildScheduledInspectionEvents(
      [hive({ lastInspectionDate: new Date(2026, 0, 1) })],
      new Date(2026, 3, 15),
      1,
    );
    expect(events[0]).toMatchObject({
      summary: 'OVERDUE: Hive 01 Inspection',
      isOverdue: true,
      dtstart: new Date(2026, 3, 15),
    });
    expect(events[1].dtstart).toEqual(new Date(2026, 3, 22));
  });

  it('schedules nothing during a season without inspections', () => {
    // Last inspected Oct 20 on a 7-day interval: Oct 27, then winter.
    const events = buildScheduledInspectionEvents(
      [
        hive({
          lastInspectionDate: new Date(2026, 9, 20),
          settings: { inspection: { frequencyDays: 7 }, seasons: [winter] },
        }),
      ],
      new Date(2026, 9, 21),
      6,
    );
    expect(events.map((event) => event.dtstart)).toEqual([
      new Date(2026, 9, 27),
    ]);
  });

  it('is due the first day after a season without inspections ends', () => {
    // Due Nov 3, inside winter: moved to Mar 1, then every 7 days.
    const events = buildScheduledInspectionEvents(
      [
        hive({
          lastInspectionDate: new Date(2026, 9, 27),
          settings: { inspection: { frequencyDays: 7 }, seasons: [winter] },
        }),
      ],
      new Date(2027, 1, 20),
      3,
    );
    expect(events.map((event) => event.dtstart)).toEqual([
      new Date(2027, 2, 1),
      new Date(2027, 2, 8),
    ]);
  });

  it('is not overdue during a season without inspections', () => {
    const events = buildScheduledInspectionEvents(
      [
        hive({
          lastInspectionDate: null,
          settings: { inspection: { frequencyDays: 7 }, seasons: [winter] },
        }),
      ],
      new Date(2027, 0, 10),
      8,
    );
    expect(events.some((event) => event.isOverdue)).toBe(false);
    expect(events[0].dtstart).toEqual(new Date(2027, 2, 1));
  });

  it('skips hives with calendar scheduling disabled or inactive', () => {
    expect(
      buildScheduledInspectionEvents(
        [hive({ settings: { inspection: { calendarEnabled: false } } })],
        new Date(2026, 3, 5),
      ),
    ).toEqual([]);
    expect(
      buildScheduledInspectionEvents(
        [hive({ status: 'INACTIVE' })],
        new Date(2026, 3, 5),
      ),
    ).toEqual([]);
  });
});
