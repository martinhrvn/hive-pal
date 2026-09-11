import { addDays, differenceInCalendarDays } from 'date-fns';
import type { CheckpointPlan, CheckpointWarning, WarningCode } from './swarm-method-page-layout';

export type SwarmCheckpointId =
  | 'setup'
  | 'queenCellCheck'
  | 'secondQueenCellCheck'
  | 'colonyReview';

export interface SwarmCheckpointTemplate {
  id: SwarmCheckpointId;
  dayOffset: number;
  titleKey: string;
  summaryKey: string;
  checklistKeys: string[];
}

const CHECKPOINT_IDS: SwarmCheckpointId[] = [
  'setup',
  'queenCellCheck',
  'secondQueenCellCheck',
  'colonyReview',
];

const DAY_OFFSETS: Record<SwarmCheckpointId, number> = {
  setup: 0,
  queenCellCheck: 7,
  secondQueenCellCheck: 14,
  colonyReview: 21,
};

/**
 * Build a checkpoint template array for any swarm-management method.
 * Each checkpoint's i18n keys follow the pattern:
 *   `{ns}.planner.checkpoints.{id}.title`  etc.
 */
export const buildCheckpoints = (ns: string): SwarmCheckpointTemplate[] =>
  CHECKPOINT_IDS.map(id => ({
    id,
    dayOffset: DAY_OFFSETS[id],
    titleKey: `${ns}.planner.checkpoints.${id}.title`,
    summaryKey: `${ns}.planner.checkpoints.${id}.summary`,
    checklistKeys: [0, 1, 2].map(
      i => `${ns}.planner.checkpoints.${id}.checklist.${i}`,
    ),
  }));

/**
 * Generate a dated plan from a set of checkpoint templates.
 */
export const buildGeneratePlan =
  (checkpoints: SwarmCheckpointTemplate[]) =>
  (startDate: Date): CheckpointPlan[] =>
    checkpoints.map(checkpoint => ({
      ...checkpoint,
      date: addDays(startDate, checkpoint.dayOffset),
    }));

/**
 * Derive timing warnings from a list of scheduled checkpoints.
 * Shared logic identical across all three swarm-management methods.
 */
export const buildGetWarnings =
  (checkpoints: SwarmCheckpointTemplate[]) =>
  (
    scheduled: Array<Pick<CheckpointPlan, 'id' | 'date'>>,
  ): CheckpointWarning[] => {
    const warnings: CheckpointWarning[] = [];

    // Use the first two checkpoint IDs from the template for the late-check warning.
    const [firstId, secondId] = checkpoints.map(c => c.id);

    const first = scheduled.find(c => c.id === firstId);
    const second = scheduled.find(c => c.id === secondId);

    if (first && second) {
      const gap = differenceInCalendarDays(second.date, first.date);
      if (gap > 8) {
        warnings.push({
          code: 'lateQueenCellCheck' as WarningCode,
          checkpointIds: [firstId, secondId],
        });
      }
    }

    for (let i = 1; i < scheduled.length; i += 1) {
      const prev = scheduled[i - 1];
      const curr = scheduled[i];
      const gap = differenceInCalendarDays(curr.date, prev.date);

      if (gap <= 0) {
        warnings.push({
          code: 'illogicalScheduleOrder' as WarningCode,
          checkpointIds: [prev.id, curr.id],
        });
        continue;
      }

      if (gap < 5 || gap > 10) {
        warnings.push({
          code: 'unsafeCheckpointSpacing' as WarningCode,
          checkpointIds: [prev.id, curr.id],
        });
      }
    }

    return warnings;
  };
