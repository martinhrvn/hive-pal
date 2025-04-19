import { useState } from 'react';
import NumericInputField from '@/components/common/numeric-input-field.tsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditIcon, TrashIcon } from 'lucide-react';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { Textarea } from '@/components/ui/textarea';

export type FramesActionType = {
  type: 'FRAME';
  frames: number;
  notes?: string;
};

type FramesActionProps = {
  action?: FramesActionType;
  onSave: (action: FramesActionType) => void;
  onRemove: (action: 'FRAME') => void;
};

export const FramesForm: React.FC<FramesActionProps> = ({ action, onSave }) => {
  const [frames, setFrames] = useState<number | null>(action?.frames ?? 0);
  const [notes, setNotes] = useState<string>(action?.notes ?? '');

  return (
    <div
      className={'grid lg:grid-cols-2 grid-cols-1 gap-4 mt-5'}
      data-test={TEST_SELECTORS.FRAMES_FORM}
    >
      <h3 className="lg:col-span-2 text-lg font-bold">Frames</h3>
      <div className={'flex flex-col gap-4 col-span-2'}>
        <label htmlFor={'frames'}>Number of frames added/removed</label>
        <NumericInputField
          id={'frames'}
          step={1}
          min={-20}
          max={20}
          value={frames}
          onChange={e => setFrames(e)}
          renderIcon={() => (
            <span className="text-xs text-gray-500">
              {frames && frames > 0 ? '+' : ''}
            </span>
          )}
        />
        <div className="text-sm text-gray-500">
          Use positive numbers for frames added, negative for frames removed
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-4">
        <label htmlFor="notes">Notes (optional)</label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes about frames changes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          data-test={TEST_SELECTORS.FRAMES_NOTES}
        />
      </div>

      <div className="col-span-2 flex justify-end">
        {frames !== null && (
          <Button
            onClick={() => {
              onSave({
                type: 'FRAME',
                frames,
                notes: notes.trim() || undefined,
              });
            }}
          >
            Save
          </Button>
        )}
      </div>
    </div>
  );
};

export const FramesView: React.FC<FramesActionProps> = ({
  action,
  onSave,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!action) {
    return null;
  }

  const framesDisplay =
    action.frames > 0 ? `+${action.frames} frames` : `${action.frames} frames`;

  return isEditing ? (
    <FramesForm
      action={action}
      onSave={a => {
        onSave(a);
        setIsEditing(false);
      }}
      onRemove={onRemove}
    />
  ) : (
    <div
      className={'flex justify-between items-center w-full mt-5'}
      data-test={TEST_SELECTORS.FRAMES_VIEW}
    >
      <div className={'flex flex-col gap-2'}>
        <h3 className="font-medium">Frames</h3>
        <div className={'flex gap-5 text-sm'}>
          <Badge>{framesDisplay}</Badge>
        </div>
        {action.notes && (
          <div className="text-sm text-gray-600 mt-1">
            <span>Notes: {action.notes}</span>
          </div>
        )}
      </div>
      <div>
        <Button
          variant={'ghost'}
          aria-label={'Edit'}
          onClick={() => setIsEditing(true)}
        >
          <EditIcon />
        </Button>
        <Button
          variant={'ghost'}
          aria-label={'Delete'}
          onClick={() => onRemove('FRAME')}
        >
          <TrashIcon />
        </Button>
      </div>
    </div>
  );
};
