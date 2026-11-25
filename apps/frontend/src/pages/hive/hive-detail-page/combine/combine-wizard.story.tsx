import { MemoryRouter } from 'react-router';
import { CombineWizard } from './combine-wizard';
import type { HiveDetailResponse } from 'shared-schemas';

const APIARY_ID = '11111111-1111-4111-8111-111111111111';
const HIVE_ID = '22222222-2222-4222-8222-222222222222';
const QUEEN_ID = '33333333-3333-4333-8333-333333333333';

// Minimal mock — the wizard only reads id, name, apiaryId, status, activeQueen.
const hive = {
  id: HIVE_ID,
  name: 'Volk 7',
  apiaryId: APIARY_ID,
  status: 'ACTIVE',
  boxes: [],
  activeQueen: { id: QUEEN_ID, marking: 'Blue 7', year: 2025 },
} as unknown as HiveDetailResponse;

// The wizard navigates to the survivor when the current hive is absorbed.
export const Default = () => (
  <MemoryRouter>
    <CombineWizard hive={hive} open onOpenChange={() => {}} />
  </MemoryRouter>
);
