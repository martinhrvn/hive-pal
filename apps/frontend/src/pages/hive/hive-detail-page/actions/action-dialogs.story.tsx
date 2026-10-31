import { MemoryRouter } from 'react-router';
import { ActionType, type ActionResponse } from 'shared-schemas';
import { AddActionDialog } from './add-action-dialog';
import { EditActionDialog } from './edit-action-dialog';

// A standalone note logged at 15:30 UTC on 10 June 2026.
const noteAction = {
  id: 'action-1',
  hiveId: 'hive-1',
  type: ActionType.NOTE,
  date: '2026-06-10T15:30:00.000Z',
  notes: 'Bees calm',
  details: { type: ActionType.NOTE, content: 'Bees calm' },
} as unknown as ActionResponse;

// The actions section links to the product catalog, so it needs a router.
export const EditNoteAction = () => (
  <MemoryRouter>
    <EditActionDialog action={noteAction} open onOpenChange={() => {}} />
  </MemoryRouter>
);

export const AddAction = () => (
  <MemoryRouter>
    <AddActionDialog hiveId="hive-1" open onOpenChange={() => {}} />
  </MemoryRouter>
);

const splitAction = {
  id: 'action-2',
  hiveId: 'hive-1',
  type: ActionType.SPLIT,
  date: '2026-06-10T09:00:00.000Z',
  notes: 'Moved 3 brood frames',
  details: { type: ActionType.SPLIT },
} as unknown as ActionResponse;

export const EditSplitAction = () => (
  <MemoryRouter>
    <EditActionDialog action={splitAction} open onOpenChange={() => {}} />
  </MemoryRouter>
);
