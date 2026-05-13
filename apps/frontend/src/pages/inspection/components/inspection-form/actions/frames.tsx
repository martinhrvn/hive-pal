import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import NumericInputField from '@/components/common/numeric-input-field.tsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { Textarea } from '@/components/ui/textarea';
import { ActionViewRenderer } from './action-view-container';

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
  const { t } = useTranslation('inspection');
  const [frames, setFrames] = useState<number | null>(action?.frames ?? 0);
  const [notes, setNotes] = useState<string>(action?.notes ?? '');

  return (
    <div
      className={'grid lg:grid-cols-2 grid-cols-1 gap-4 mt-5'}
      data-test={TEST_SELECTORS.FRAMES_FORM}
    >
      <h3 className="lg:col-span-2 text-lg font-bold">{t('inspection:form.actions.frames_section.title')}</h3>
      <div className={'flex flex-col gap-4 col-span-2'}>
        <label htmlFor={'frames'}>{t('inspection:form.actions.frames_section.framesLabel')}</label>
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
          {t('inspection:form.actions.frames_section.framesHint')}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-4">
        <label htmlFor="notes">{t('inspection:form.actions.frames_section.notesOptional')}</label>
        <Textarea
          id="notes"
          placeholder={t('inspection:form.actions.frames_section.notesPlaceholder')}
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
            {t('inspection:form.actions.save')}
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
  const { t } = useTranslation('inspection');
  const [isEditing, setIsEditing] = useState(false);

  if (!action) {
    return null;
  }

  const framesDisplay =
    action.frames > 0 ? `+${action.frames} frames` : `${action.frames} frames`;

  const handleSave = (updatedAction: FramesActionType) => {
    onSave(updatedAction);
    setIsEditing(false);
  };

  return isEditing ? (
    <FramesForm
      action={action}
      onSave={handleSave}
      onRemove={onRemove}
    />
  ) : (
    <ActionViewRenderer
      title={t('inspection:form.actions.frames_section.title')}
      badges={<Badge>{framesDisplay}</Badge>}
      notes={action.notes}
      onEdit={() => setIsEditing(true)}
      onRemove={() => onRemove('FRAME')}
      data-test={TEST_SELECTORS.FRAMES_VIEW}
    />
  );
};
