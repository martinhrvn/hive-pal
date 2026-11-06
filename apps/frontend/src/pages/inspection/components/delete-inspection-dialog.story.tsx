import { useState } from 'react';
import {
  ActionType,
  BoxTypeEnum,
  BoxVariantEnum,
  type ActionResponse,
  type Box,
  type BoxSnapshot,
} from 'shared-schemas';
import { DeleteInspectionDialog } from './delete-inspection-dialog';

/**
 * Story harness for deleting an inspection that changed the hive. The dialog
 * opens straight away and reports which delete was chosen, so component tests
 * can assert both the explanation and the request it would send.
 */

const brood: Box = {
  position: 0,
  frameCount: 10,
  maxFrameCount: 10,
  hasExcluder: false,
  type: BoxTypeEnum.BROOD,
  variant: BoxVariantEnum.LANGSTROTH_DEEP,
  color: '#3b82f6',
  winterized: false,
};
const honeySuper: Box = {
  ...brood,
  position: 1,
  frameCount: 9,
  hasExcluder: true,
  type: BoxTypeEnum.HONEY,
};

// The hive as the inspection left it: brood box plus a honey super.
const hiveAfterInspection = [brood, honeySuper];
const appliedLayout: BoxSnapshot[] = hiveAfterInspection.map(box => ({
  position: box.position,
  frameCount: box.frameCount,
  maxFrameCount: box.maxFrameCount ?? 10,
  hasExcluder: box.hasExcluder,
  type: box.type,
  variant: box.variant ?? null,
  frameSizeId: null,
  color: box.color ?? null,
  addedAt: '2026-05-01T10:00:00.000Z',
  winterized: false,
}));

const base = {
  hiveId: '11111111-1111-4111-8111-111111111111',
  inspectionId: '22222222-2222-4222-8222-222222222222',
  harvestId: null,
  date: '2026-05-01T10:00:00.000Z',
};

const boxAction: ActionResponse = {
  ...base,
  id: '33333333-3333-4333-8333-333333333333',
  type: ActionType.BOX_CONFIGURATION,
  details: {
    type: ActionType.BOX_CONFIGURATION,
    boxesAdded: 1,
    boxesRemoved: 0,
    framesAdded: 9,
    framesRemoved: 0,
    totalBoxes: 2,
    totalFrames: 19,
    appliedLayout,
  },
};

const frameAction = (quantity: number): ActionResponse => ({
  ...base,
  id: '44444444-4444-4444-8444-444444444444',
  type: ActionType.FRAME,
  details: { type: ActionType.FRAME, quantity },
});

const feedingAction: ActionResponse = {
  ...base,
  id: '55555555-5555-4555-8555-555555555555',
  type: ActionType.FEEDING,
  details: {
    type: ActionType.FEEDING,
    feedType: 'Sugar Syrup',
    amount: 1,
    unit: 'l',
  },
};

interface HarnessProps {
  actions: ActionResponse[];
  hiveBoxes: Box[];
}

const Harness = ({ actions, hiveBoxes }: HarnessProps) => {
  const [open, setOpen] = useState(true);
  const [deleted, setDeleted] = useState('');

  return (
    <div className="p-4">
      <pre data-test="last-delete">{deleted}</pre>
      <DeleteInspectionDialog
        open={open}
        onOpenChange={setOpen}
        actions={actions}
        hiveBoxes={hiveBoxes}
        isPending={false}
        onDelete={revertHiveChanges => {
          setDeleted(JSON.stringify({ revertHiveChanges }));
          setOpen(false);
        }}
      />
    </div>
  );
};

/** Box and frame changes, hive untouched since: both can be undone. */
export const BoxAndFrameChanges = () => (
  <Harness
    actions={[boxAction, frameAction(-2)]}
    hiveBoxes={hiveAfterInspection}
  />
);

/** The hive's boxes changed after the inspection: only frames can be undone. */
export const BoxChangeLocked = () => (
  <Harness
    actions={[boxAction, frameAction(2)]}
    hiveBoxes={[brood, { ...honeySuper, frameCount: 10 }]}
  />
);

/** A locked box change and nothing else: a plain delete with a note. */
export const BoxChangeLockedOnly = () => (
  <Harness actions={[boxAction]} hiveBoxes={[brood]} />
);

/** No hive changes at all: a plain delete confirmation. */
export const NoHiveChanges = () => (
  <Harness actions={[feedingAction]} hiveBoxes={[brood]} />
);
