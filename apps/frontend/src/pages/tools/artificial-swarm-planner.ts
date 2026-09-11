import {
  buildCheckpoints,
  buildGeneratePlan,
  buildGetWarnings,
} from './swarm-planner-factory';

export const ARTIFICIAL_SWARM_CHECKPOINTS = buildCheckpoints(
  'swarmManagement.artificialSwarm',
);

export const generateArtificialSwarmPlan = buildGeneratePlan(
  ARTIFICIAL_SWARM_CHECKPOINTS,
);

export const getArtificialSwarmWarnings = buildGetWarnings(
  ARTIFICIAL_SWARM_CHECKPOINTS,
);

// Re-export types consumed by the page wrapper and tests
export type { SwarmCheckpointTemplate as ArtificialSwarmCheckpointTemplate } from './swarm-planner-factory';
export type { CheckpointPlan as ArtificialSwarmCheckpointPlan } from './swarm-method-page-layout';
