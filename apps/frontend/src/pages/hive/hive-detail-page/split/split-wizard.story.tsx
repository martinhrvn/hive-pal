import { SplitWizard } from './split-wizard';
import type { HiveDetailResponse } from 'shared-schemas';

// Minimal mock — the wizard only reads id, name, apiaryId, boxes, activeQueen.
const hive = {
  id: 'hive-1',
  name: 'Volk 7',
  apiaryId: 'apiary-1',
  status: 'ACTIVE',
  boxes: [
    {
      id: 'box-1',
      position: 0,
      frameCount: 10,
      maxFrameCount: 12,
      hasExcluder: false,
      type: 'BROOD',
      winterized: false,
    },
  ],
  activeQueen: { id: 'queen-1' },
} as unknown as HiveDetailResponse;

export const Default = () => (
  <SplitWizard hive={hive} open onOpenChange={() => {}} />
);
