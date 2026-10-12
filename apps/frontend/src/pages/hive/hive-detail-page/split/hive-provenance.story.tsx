import { MemoryRouter } from 'react-router-dom';
import { HiveProvenance } from './hive-provenance';
import type { HiveDetailResponse } from 'shared-schemas';

const base = {
  id: 'hive-1',
  name: 'Volk 7',
  apiaryId: 'apiary-1',
  status: 'ACTIVE',
  boxes: [],
} as unknown as HiveDetailResponse;

export const WithMother = () => (
  <MemoryRouter>
    <HiveProvenance
      hive={
        {
          ...base,
          parentHive: { id: 'mother-9', name: 'Volk 3', status: 'ACTIVE' },
          offspring: [],
        } as unknown as HiveDetailResponse
      }
    />
  </MemoryRouter>
);

export const WithOffspring = () => (
  <MemoryRouter>
    <HiveProvenance
      hive={
        {
          ...base,
          parentHive: null,
          offspring: [
            { id: 'child-1', name: 'Ableger A', status: 'ACTIVE' },
            { id: 'child-2', name: 'Ableger B', status: 'ACTIVE' },
          ],
        } as unknown as HiveDetailResponse
      }
    />
  </MemoryRouter>
);

export const Empty = () => (
  <MemoryRouter>
    <HiveProvenance
      hive={
        {
          ...base,
          parentHive: null,
          offspring: [],
        } as unknown as HiveDetailResponse
      }
    />
  </MemoryRouter>
);
