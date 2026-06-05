import { addDays, differenceInCalendarDays } from 'date-fns';

export type DemareeCheckpointId =
  | 'setup'
  | 'queenCellCheck'
  | 'secondQueenCellCheck'
  | 'colonyReview';

export interface DemareeCheckpointTemplate {
  id: DemareeCheckpointId;
  dayOffset: number;
  titleKey: string;
  summaryKey: string;
  checklistKeys: string[];
}

export interface DemareeCheckpointPlan extends DemareeCheckpointTemplate {
  date: Date;
}

export type DemareeWarningCode =
  | 'lateQueenCellCheck'
  | 'unsafeCheckpointSpacing'
  | 'illogicalScheduleOrder';

export interface DemareeWarning {
  code: DemareeWarningCode;
  checkpointIds: DemareeCheckpointId[];
}

export const DEMAREE_CHECKPOINTS: DemareeCheckpointTemplate[] = [
  {
    id: 'setup',
    dayOffset: 0,
    titleKey: 'swarmManagement.planner.checkpoints.setup.title',
    summaryKey: 'swarmManagement.planner.checkpoints.setup.summary',
    checklistKeys: [
      'swarmManagement.planner.checkpoints.setup.checklist.0',
      'swarmManagement.planner.checkpoints.setup.checklist.1',
      'swarmManagement.planner.checkpoints.setup.checklist.2',
    ],
  },
  {
    id: 'queenCellCheck',
    dayOffset: 7,
    titleKey: 'swarmManagement.planner.checkpoints.queenCellCheck.title',
    summaryKey: 'swarmManagement.planner.checkpoints.queenCellCheck.summary',
    checklistKeys: [
      'swarmManagement.planner.checkpoints.queenCellCheck.checklist.0',
      'swarmManagement.planner.checkpoints.queenCellCheck.checklist.1',
      'swarmManagement.planner.checkpoints.queenCellCheck.checklist.2',
    ],
  },
  {
    id: 'secondQueenCellCheck',
    dayOffset: 14,
    titleKey: 'swarmManagement.planner.checkpoints.secondQueenCellCheck.title',
    summaryKey:
      'swarmManagement.planner.checkpoints.secondQueenCellCheck.summary',
    checklistKeys: [
      'swarmManagement.planner.checkpoints.secondQueenCellCheck.checklist.0',
      'swarmManagement.planner.checkpoints.secondQueenCellCheck.checklist.1',
      'swarmManagement.planner.checkpoints.secondQueenCellCheck.checklist.2',
    ],
  },
  {
    id: 'colonyReview',
    dayOffset: 21,
    titleKey: 'swarmManagement.planner.checkpoints.colonyReview.title',
    summaryKey: 'swarmManagement.planner.checkpoints.colonyReview.summary',
    checklistKeys: [
      'swarmManagement.planner.checkpoints.colonyReview.checklist.0',
      'swarmManagement.planner.checkpoints.colonyReview.checklist.1',
      'swarmManagement.planner.checkpoints.colonyReview.checklist.2',
    ],
  },
];

export const generateDemareePlan = (startDate: Date): DemareeCheckpointPlan[] =>
  DEMAREE_CHECKPOINTS.map(checkpoint => ({
    ...checkpoint,
    date: addDays(startDate, checkpoint.dayOffset),
  }));

export const getDemareeWarnings = (
  checkpoints: Array<Pick<DemareeCheckpointPlan, 'id' | 'date'>>,
): DemareeWarning[] => {
  const warnings: DemareeWarning[] = [];

  const setup = checkpoints.find(checkpoint => checkpoint.id === 'setup');
  const queenCellCheck = checkpoints.find(
    checkpoint => checkpoint.id === 'queenCellCheck',
  );

  if (setup && queenCellCheck) {
    const queenCellGap = differenceInCalendarDays(
      queenCellCheck.date,
      setup.date,
    );

    if (queenCellGap > 8) {
      warnings.push({
        code: 'lateQueenCellCheck',
        checkpointIds: ['setup', 'queenCellCheck'],
      });
    }
  }

  for (let index = 1; index < checkpoints.length; index += 1) {
    const previousCheckpoint = checkpoints[index - 1];
    const currentCheckpoint = checkpoints[index];
    const gap = differenceInCalendarDays(
      currentCheckpoint.date,
      previousCheckpoint.date,
    );

    if (gap <= 0) {
      warnings.push({
        code: 'illogicalScheduleOrder',
        checkpointIds: [previousCheckpoint.id, currentCheckpoint.id],
      });
      continue;
    }

    if (gap < 5 || gap > 10) {
      warnings.push({
        code: 'unsafeCheckpointSpacing',
        checkpointIds: [previousCheckpoint.id, currentCheckpoint.id],
      });
    }
  }

  return warnings;
};
