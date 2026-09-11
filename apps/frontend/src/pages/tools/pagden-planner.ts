import {
  buildCheckpoints,
  buildGeneratePlan,
  buildGetWarnings,
} from './swarm-planner-factory';

export const PAGDEN_CHECKPOINTS = buildCheckpoints('swarmManagement.pagden');

export const generatePagdenPlan = buildGeneratePlan(PAGDEN_CHECKPOINTS);

export const getPagdenWarnings = buildGetWarnings(PAGDEN_CHECKPOINTS);

// Re-export types consumed by the page wrapper and tests
export type { SwarmCheckpointTemplate as PagdenCheckpointTemplate } from './swarm-planner-factory';
export type { CheckpointPlan as PagdenCheckpointPlan } from './swarm-method-page-layout';
