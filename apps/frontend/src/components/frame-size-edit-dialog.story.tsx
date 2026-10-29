import { useState } from 'react';
import { FrameSize } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import { FrameSizeEditDialog } from './frame-size-edit-dialog';

/**
 * Story harness for the shared frame-size editor: the dialog is mounted on
 * demand and reports the payload it received, so component tests can assert
 * both the interaction and the request body sent to the API.
 */

const OWNER_ID = '11111111-1111-4111-8111-111111111111';

const baseSize: FrameSize = {
  id: '44444444-4444-4444-8444-444444444444',
  name: '12x10',
  width: 300,
  height: 250,
  depth: 12,
  isBuiltIn: false,
  status: 'PENDING',
  createdByUserId: OWNER_ID,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
};

interface HarnessProps {
  status?: FrameSize['status'];
  rejectOnSave?: boolean;
}

const Harness = ({
  status = 'PENDING',
  rejectOnSave = false,
}: HarnessProps) => {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState('');
  const frameSize: FrameSize = { ...baseSize, status };

  return (
    <div className="space-y-3 p-4">
      <Button data-test="open-dialog" onClick={() => setOpen(true)}>
        Edit 12x10
      </Button>
      <pre data-test="last-save">{saved}</pre>
      {open && (
        <FrameSizeEditDialog
          key={frameSize.id}
          frameSize={frameSize}
          onClose={() => setOpen(false)}
          onSave={async (id, data) => {
            if (rejectOnSave) throw new Error('save rejected');
            setSaved(JSON.stringify({ id, ...data }));
          }}
        />
      )}
    </div>
  );
};

/** A submission still waiting for review: no community-facing change yet. */
export const Pending = () => <Harness />;

/** An approved size is shared, so the dialog warns about other beekeepers. */
export const Shared = () => <Harness status="APPROVED" />;

/** A failing save keeps the dialog open so the draft is not lost. */
export const SaveFails = () => <Harness rejectOnSave />;
