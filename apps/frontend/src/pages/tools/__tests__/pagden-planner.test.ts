import { describe, it, expect } from 'vitest';
import {
  generatePagdenPlan,
  getPagdenWarnings,
  type PagdenCheckpointPlan,
} from '../pagden-planner';

describe('Pagden Planner', () => {
  describe('generatePagdenPlan', () => {
    it('generates 4 checkpoints at correct day offsets (0, 7, 14, 21)', () => {
      const startDate = new Date('2025-05-01');
      const plan = generatePagdenPlan(startDate);

      expect(plan).toHaveLength(4);
      expect(plan[0].dayOffset).toBe(0);
      expect(plan[1].dayOffset).toBe(7);
      expect(plan[2].dayOffset).toBe(14);
      expect(plan[3].dayOffset).toBe(21);
    });

    it('generates correct dates for known start date', () => {
      const startDate = new Date('2025-05-01');
      const plan = generatePagdenPlan(startDate);

      expect(plan[0].date.toISOString().split('T')[0]).toBe('2025-05-01');
      expect(plan[1].date.toISOString().split('T')[0]).toBe('2025-05-08');
      expect(plan[2].date.toISOString().split('T')[0]).toBe('2025-05-15');
      expect(plan[3].date.toISOString().split('T')[0]).toBe('2025-05-22');
    });

    it('includes correct checkpoint IDs', () => {
      const startDate = new Date('2025-05-01');
      const plan = generatePagdenPlan(startDate);

      expect(plan[0].id).toBe('setup');
      expect(plan[1].id).toBe('queenCellCheck');
      expect(plan[2].id).toBe('secondQueenCellCheck');
      expect(plan[3].id).toBe('colonyReview');
    });

    it('includes i18n keys for each checkpoint', () => {
      const startDate = new Date('2025-05-01');
      const plan = generatePagdenPlan(startDate);

      plan.forEach(checkpoint => {
        expect(checkpoint.titleKey).toContain('swarmManagement.pagden.planner.checkpoints');
        expect(checkpoint.summaryKey).toContain('swarmManagement.pagden.planner.checkpoints');
        expect(checkpoint.checklistKeys.length).toBeGreaterThan(0);
        checkpoint.checklistKeys.forEach(key => {
          expect(key).toContain('swarmManagement.pagden.planner.checkpoints');
        });
      });
    });
  });

  describe('getPagdenWarnings', () => {
    it('emits lateQueenCellCheck warning when gap exceeds 8 days', () => {
      const checkpoints: Pick<PagdenCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-05-01') },
        { id: 'queenCellCheck', date: new Date('2025-05-10') }, // 9 days gap
        { id: 'secondQueenCellCheck', date: new Date('2025-05-17') },
        { id: 'colonyReview', date: new Date('2025-05-24') },
      ];

      const warnings = getPagdenWarnings(checkpoints);

      expect(warnings).toContainEqual({
        code: 'lateQueenCellCheck',
        checkpointIds: ['setup', 'queenCellCheck'],
      });
    });

    it('does not emit lateQueenCellCheck warning when gap is 8 days or less', () => {
      const checkpoints: Pick<PagdenCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-05-01') },
        { id: 'queenCellCheck', date: new Date('2025-05-09') }, // 8 days gap
        { id: 'secondQueenCellCheck', date: new Date('2025-05-16') },
        { id: 'colonyReview', date: new Date('2025-05-23') },
      ];

      const warnings = getPagdenWarnings(checkpoints);

      expect(warnings.find(w => w.code === 'lateQueenCellCheck')).toBeUndefined();
    });

    it('emits unsafeCheckpointSpacing warning when gap is less than 5 days', () => {
      const checkpoints: Pick<PagdenCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-05-01') },
        { id: 'queenCellCheck', date: new Date('2025-05-05') }, // 4 days gap
        { id: 'secondQueenCellCheck', date: new Date('2025-05-12') },
        { id: 'colonyReview', date: new Date('2025-05-19') },
      ];

      const warnings = getPagdenWarnings(checkpoints);

      expect(warnings).toContainEqual({
        code: 'unsafeCheckpointSpacing',
        checkpointIds: ['setup', 'queenCellCheck'],
      });
    });

    it('emits unsafeCheckpointSpacing warning when gap is more than 10 days', () => {
      const checkpoints: Pick<PagdenCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-05-01') },
        { id: 'queenCellCheck', date: new Date('2025-05-08') },
        { id: 'secondQueenCellCheck', date: new Date('2025-05-20') }, // 12 days gap
        { id: 'colonyReview', date: new Date('2025-05-27') },
      ];

      const warnings = getPagdenWarnings(checkpoints);

      expect(warnings).toContainEqual({
        code: 'unsafeCheckpointSpacing',
        checkpointIds: ['queenCellCheck', 'secondQueenCellCheck'],
      });
    });

    it('emits illogicalScheduleOrder warning when dates are out of order', () => {
      const checkpoints: Pick<PagdenCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-05-01') },
        { id: 'queenCellCheck', date: new Date('2025-05-08') },
        { id: 'secondQueenCellCheck', date: new Date('2025-05-07') }, // Before previous
        { id: 'colonyReview', date: new Date('2025-05-22') },
      ];

      const warnings = getPagdenWarnings(checkpoints);

      expect(warnings).toContainEqual({
        code: 'illogicalScheduleOrder',
        checkpointIds: ['queenCellCheck', 'secondQueenCellCheck'],
      });
    });

    it('returns empty array when no warnings are triggered', () => {
      const checkpoints: Pick<PagdenCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-05-01') },
        { id: 'queenCellCheck', date: new Date('2025-05-08') }, // 7 days
        { id: 'secondQueenCellCheck', date: new Date('2025-05-15') }, // 7 days
        { id: 'colonyReview', date: new Date('2025-05-22') }, // 7 days
      ];

      const warnings = getPagdenWarnings(checkpoints);

      expect(warnings).toHaveLength(0);
    });
  });
});
