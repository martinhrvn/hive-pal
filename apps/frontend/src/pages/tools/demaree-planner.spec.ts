import { addDays } from 'date-fns';
import { describe, expect, it } from 'vitest';
import {
  generateDemareePlan,
  getDemareeWarnings,
} from './demaree-planner';

describe('demaree planner utilities', () => {
  it('generates the standard checkpoint offsets', () => {
    const startDate = new Date('2026-05-01T00:00:00.000Z');
    const checkpoints = generateDemareePlan(startDate);

    expect(checkpoints.map(checkpoint => checkpoint.dayOffset)).toEqual([
      0, 7, 14, 21,
    ]);
    expect(checkpoints[1].date.toISOString()).toBe(
      '2026-05-08T00:00:00.000Z',
    );
  });

  it('warns when the first queen-cell check is delayed past day 8', () => {
    const startDate = new Date('2026-05-01T00:00:00.000Z');
    const checkpoints = generateDemareePlan(startDate);

    checkpoints[1].date = addDays(startDate, 9);

    expect(getDemareeWarnings(checkpoints)).toContainEqual({
      code: 'lateQueenCellCheck',
      checkpointIds: ['setup', 'queenCellCheck'],
    });
  });

  it('warns when checkpoint spacing becomes unsafe', () => {
    const checkpoints = generateDemareePlan(
      new Date('2026-05-01T00:00:00.000Z'),
    );

    checkpoints[2].date = addDays(checkpoints[1].date, 11);

    expect(getDemareeWarnings(checkpoints)).toContainEqual({
      code: 'unsafeCheckpointSpacing',
      checkpointIds: ['queenCellCheck', 'secondQueenCellCheck'],
    });
  });

  it('warns when checkpoint order is no longer chronological', () => {
    const checkpoints = generateDemareePlan(
      new Date('2026-05-01T00:00:00.000Z'),
    );

    checkpoints[2].date = checkpoints[1].date;

    expect(getDemareeWarnings(checkpoints)).toContainEqual({
      code: 'illogicalScheduleOrder',
      checkpointIds: ['queenCellCheck', 'secondQueenCellCheck'],
    });
  });
});
