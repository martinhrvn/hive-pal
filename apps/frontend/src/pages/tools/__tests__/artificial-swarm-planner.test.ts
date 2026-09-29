import { describe, it, expect } from 'vitest';
import {
  generateArtificialSwarmPlan,
  getArtificialSwarmWarnings,
  type ArtificialSwarmCheckpointPlan,
} from '../artificial-swarm-planner';

describe('Artificial Swarm Planner', () => {
  describe('generateArtificialSwarmPlan', () => {
    it('generates 4 checkpoints at correct day offsets (0, 7, 14, 21)', () => {
      const startDate = new Date('2025-06-01');
      const plan = generateArtificialSwarmPlan(startDate);

      expect(plan).toHaveLength(4);
      expect(plan[0].dayOffset).toBe(0);
      expect(plan[1].dayOffset).toBe(7);
      expect(plan[2].dayOffset).toBe(14);
      expect(plan[3].dayOffset).toBe(21);
    });

    it('generates correct dates for known start date', () => {
      const startDate = new Date('2025-06-01');
      const plan = generateArtificialSwarmPlan(startDate);

      expect(plan[0].date.toISOString().split('T')[0]).toBe('2025-06-01');
      expect(plan[1].date.toISOString().split('T')[0]).toBe('2025-06-08');
      expect(plan[2].date.toISOString().split('T')[0]).toBe('2025-06-15');
      expect(plan[3].date.toISOString().split('T')[0]).toBe('2025-06-22');
    });

    it('includes correct checkpoint IDs', () => {
      const startDate = new Date('2025-06-01');
      const plan = generateArtificialSwarmPlan(startDate);

      expect(plan[0].id).toBe('setup');
      expect(plan[1].id).toBe('queenCellCheck');
      expect(plan[2].id).toBe('secondQueenCellCheck');
      expect(plan[3].id).toBe('colonyReview');
    });

    it('includes i18n keys for each checkpoint', () => {
      const startDate = new Date('2025-06-01');
      const plan = generateArtificialSwarmPlan(startDate);

      plan.forEach(checkpoint => {
        expect(checkpoint.titleKey).toContain('swarmManagement.artificialSwarm.planner.checkpoints');
        expect(checkpoint.summaryKey).toContain('swarmManagement.artificialSwarm.planner.checkpoints');
        expect(checkpoint.checklistKeys.length).toBeGreaterThan(0);
        checkpoint.checklistKeys.forEach(key => {
          expect(key).toContain('swarmManagement.artificialSwarm.planner.checkpoints');
        });
      });
    });
  });

  describe('getArtificialSwarmWarnings', () => {
    it('emits lateQueenCellCheck warning when gap exceeds 8 days', () => {
      const checkpoints: Pick<ArtificialSwarmCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-06-01') },
        { id: 'queenCellCheck', date: new Date('2025-06-10') }, // 9 days gap
        { id: 'secondQueenCellCheck', date: new Date('2025-06-17') },
        { id: 'colonyReview', date: new Date('2025-06-24') },
      ];

      const warnings = getArtificialSwarmWarnings(checkpoints);

      expect(warnings).toContainEqual({
        code: 'lateQueenCellCheck',
        checkpointIds: ['setup', 'queenCellCheck'],
      });
    });

    it('does not emit lateQueenCellCheck warning when gap is 8 days or less', () => {
      const checkpoints: Pick<ArtificialSwarmCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-06-01') },
        { id: 'queenCellCheck', date: new Date('2025-06-09') }, // 8 days gap
        { id: 'secondQueenCellCheck', date: new Date('2025-06-16') },
        { id: 'colonyReview', date: new Date('2025-06-23') },
      ];

      const warnings = getArtificialSwarmWarnings(checkpoints);

      expect(warnings.find(w => w.code === 'lateQueenCellCheck')).toBeUndefined();
    });

    it('emits unsafeCheckpointSpacing warning when gap is less than 5 days', () => {
      const checkpoints: Pick<ArtificialSwarmCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-06-01') },
        { id: 'queenCellCheck', date: new Date('2025-06-05') }, // 4 days gap
        { id: 'secondQueenCellCheck', date: new Date('2025-06-12') },
        { id: 'colonyReview', date: new Date('2025-06-19') },
      ];

      const warnings = getArtificialSwarmWarnings(checkpoints);

      expect(warnings).toContainEqual({
        code: 'unsafeCheckpointSpacing',
        checkpointIds: ['setup', 'queenCellCheck'],
      });
    });

    it('emits unsafeCheckpointSpacing warning when gap is more than 10 days', () => {
      const checkpoints: Pick<ArtificialSwarmCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-06-01') },
        { id: 'queenCellCheck', date: new Date('2025-06-08') },
        { id: 'secondQueenCellCheck', date: new Date('2025-06-20') }, // 12 days gap
        { id: 'colonyReview', date: new Date('2025-06-27') },
      ];

      const warnings = getArtificialSwarmWarnings(checkpoints);

      expect(warnings).toContainEqual({
        code: 'unsafeCheckpointSpacing',
        checkpointIds: ['queenCellCheck', 'secondQueenCellCheck'],
      });
    });

    it('emits illogicalScheduleOrder warning when dates are out of order', () => {
      const checkpoints: Pick<ArtificialSwarmCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-06-01') },
        { id: 'queenCellCheck', date: new Date('2025-06-08') },
        { id: 'secondQueenCellCheck', date: new Date('2025-06-07') }, // Before previous
        { id: 'colonyReview', date: new Date('2025-06-22') },
      ];

      const warnings = getArtificialSwarmWarnings(checkpoints);

      expect(warnings).toContainEqual({
        code: 'illogicalScheduleOrder',
        checkpointIds: ['queenCellCheck', 'secondQueenCellCheck'],
      });
    });

    it('returns empty array when no warnings are triggered', () => {
      const checkpoints: Pick<ArtificialSwarmCheckpointPlan, 'id' | 'date'>[] = [
        { id: 'setup', date: new Date('2025-06-01') },
        { id: 'queenCellCheck', date: new Date('2025-06-08') }, // 7 days
        { id: 'secondQueenCellCheck', date: new Date('2025-06-15') }, // 7 days
        { id: 'colonyReview', date: new Date('2025-06-22') }, // 7 days
      ];

      const warnings = getArtificialSwarmWarnings(checkpoints);

      expect(warnings).toHaveLength(0);
    });
  });
});
