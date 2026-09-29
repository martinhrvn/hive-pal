import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Pill } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { HiveStatus as HiveStatusEnum } from 'shared-schemas';
import { HiveStatus } from '@/pages/hive/components';
import { ActionViewRenderer } from './action-view-container';

export type StatusChangeActionType = {
  type: 'STATUS_CHANGE';
  toStatus: HiveStatusEnum;
  notes?: string;
};

const STATUS_OPTIONS: { id: HiveStatusEnum; label: string }[] = [
  { id: HiveStatusEnum.ACTIVE, label: 'Active' },
  { id: HiveStatusEnum.INACTIVE, label: 'Inactive' },
  { id: HiveStatusEnum.DEAD, label: 'Dead' },
  { id: HiveStatusEnum.SOLD, label: 'Sold' },
  { id: HiveStatusEnum.UNKNOWN, label: 'Unknown' },
  { id: HiveStatusEnum.ARCHIVED, label: 'Archived' },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map(({ id, label }) => [id, label]),
);

const getHiveStatusLabel = (status: string): string =>
  STATUS_LABELS[status] ?? status;

type StatusChangeActionProps = {
  action?: StatusChangeActionType;
  onSave: (action: StatusChangeActionType) => void;
  onRemove: (action: 'STATUS_CHANGE') => void;
  /** The hive's current status — excluded from the options ("all others"). */
  currentStatus?: HiveStatusEnum;
};

export const StatusChangeForm: React.FC<StatusChangeActionProps> = ({
  action,
  onSave,
  currentStatus,
}) => {
  const { t } = useTranslation('inspection');
  const [toStatus, setToStatus] = useState<HiveStatusEnum | null>(
    action?.toStatus ?? null,
  );
  const [notes, setNotes] = useState<string>(action?.notes ?? '');

  const options = STATUS_OPTIONS.filter(({ id }) => id !== currentStatus);

  return (
    <div className={'grid grid-cols-1 gap-4 mt-5'}>
      <h3 className="text-lg font-bold">
        {t('inspection:form.actions.statusChange_section.title', 'Status Change')}
      </h3>

      {currentStatus && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {t('inspection:form.actions.statusChange_section.current', 'Current')}:
          </span>
          <HiveStatus status={currentStatus} />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <label>
          {t('inspection:form.actions.statusChange_section.newStatus', 'New status')}
        </label>
        <div className="flex flex-wrap gap-4">
          {options.map(({ id, label }) => (
            <Pill
              key={id}
              color={'blue'}
              active={toStatus === id}
              onClick={e => {
                e.preventDefault();
                setToStatus(toStatus === id ? null : id);
              }}
            >
              {getHiveStatusLabel(id) || label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <label htmlFor="status-change-notes">
          {t(
            'inspection:form.actions.statusChange_section.notesOptional',
            'Reason (optional)',
          )}
        </label>
        <Textarea
          id="status-change-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        {toStatus && (
          <Button
            onClick={e => {
              e.preventDefault();
              onSave({
                type: 'STATUS_CHANGE',
                toStatus,
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

export const StatusChangeView: React.FC<StatusChangeActionProps> = ({
  action,
  onSave,
  onRemove,
  currentStatus,
}) => {
  const { t } = useTranslation('inspection');
  const [isEditing, setIsEditing] = useState(false);

  if (!action) return null;

  const handleSave = (updatedAction: StatusChangeActionType) => {
    onSave(updatedAction);
    setIsEditing(false);
  };

  return isEditing ? (
    <StatusChangeForm
      action={action}
      onSave={handleSave}
      onRemove={onRemove}
      currentStatus={currentStatus}
    />
  ) : (
    <ActionViewRenderer
      title={t('inspection:form.actions.statusChange_section.title', 'Status Change')}
      badges={<Badge>{getHiveStatusLabel(action.toStatus)}</Badge>}
      notes={action.notes}
      onEdit={() => setIsEditing(true)}
      onRemove={() => onRemove('STATUS_CHANGE')}
    />
  );
};
