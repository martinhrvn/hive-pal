import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Pill } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form';
import { InspectionFormData } from '../schema';
import { ActionViewRenderer } from './action-view-container';

export type MaintenanceActionType = {
  type: 'MAINTENANCE';
  component: string;
  status: string;
  notes?: string;
};

type MaintenanceComponent = 'BOX' | 'BOTTOM_BOARD' | 'COVER';
type MaintenanceStatus = 'CLEANED' | 'REPLACED';

const COMPONENTS: { id: MaintenanceComponent; fallbackLabel: string }[] = [
  { id: 'BOX', fallbackLabel: 'Box' },
  { id: 'BOTTOM_BOARD', fallbackLabel: 'Bottom Board' },
  { id: 'COVER', fallbackLabel: 'Cover' },
];

const STATUSES: { id: MaintenanceStatus; fallbackLabel: string }[] = [
  { id: 'CLEANED', fallbackLabel: 'Cleaned' },
  { id: 'REPLACED', fallbackLabel: 'Replaced' },
];

const COMPONENT_LABELS: Record<string, string> = Object.fromEntries(
  COMPONENTS.map(({ id, fallbackLabel }) => [id, fallbackLabel]),
);

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUSES.map(({ id, fallbackLabel }) => [id, fallbackLabel]),
);

export const getMaintenanceComponentLabel = (component: string): string =>
  COMPONENT_LABELS[component] ?? component;

export const getMaintenanceStatusLabel = (status: string): string =>
  STATUS_LABELS[status] ?? status;

type MaintenanceActionProps = {
  action?: MaintenanceActionType;
  onSave: (action: MaintenanceActionType) => void;
  onRemove: (action: 'MAINTENANCE') => void;
};

export const MaintenanceForm: React.FC<MaintenanceActionProps> = ({
  action,
  onSave,
}) => {
  const { t } = useTranslation('inspection');
  const { getValues } = useFormContext<InspectionFormData>();
  const existingActions = getValues('actions') || [];
  const existing = existingActions.find(a => a.type === 'MAINTENANCE') as
    | MaintenanceActionType
    | undefined;

  const initial = action || existing;

  const [component, setComponent] = useState<MaintenanceComponent | null>(
    (initial?.component as MaintenanceComponent) ?? null,
  );
  const [status, setStatus] = useState<MaintenanceStatus | null>(
    (initial?.status as MaintenanceStatus) ?? null,
  );
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');

  const componentI18nKeys: Record<MaintenanceComponent, string> = {
    BOX: t('inspection:form.actions.maintenance_section.box'),
    BOTTOM_BOARD: t('inspection:form.actions.maintenance_section.bottomBoard'),
    COVER: t('inspection:form.actions.maintenance_section.cover'),
  };

  const statusI18nKeys: Record<MaintenanceStatus, string> = {
    CLEANED: t('inspection:form.actions.maintenance_section.cleaned'),
    REPLACED: t('inspection:form.actions.maintenance_section.replaced'),
  };

  return (
    <div className={'grid grid-cols-1 md:grid-cols-2 gap-4 mt-5'}>
      <h3 className="md:col-span-2 col-span-1 text-lg font-bold">
        {t('inspection:form.actions.maintenance_section.title')}
      </h3>

      <div className="lg:col-span-2 flex flex-col gap-4">
        <label>{t('inspection:form.actions.maintenance_section.component')}</label>
        <div className="flex flex-wrap gap-4">
          {COMPONENTS.map(({ id, fallbackLabel }) => (
            <Pill
              key={id}
              color={'blue'}
              active={component === id}
              onClick={e => {
                e.preventDefault();
                setComponent(component === id ? null : id);
              }}
            >
              {componentI18nKeys[id] || fallbackLabel}
            </Pill>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-4">
        <label>{t('inspection:form.actions.maintenance_section.status')}</label>
        <div className="flex flex-wrap gap-4">
          {STATUSES.map(({ id, fallbackLabel }) => (
            <Pill
              key={id}
              color={'blue'}
              active={status === id}
              onClick={e => {
                e.preventDefault();
                setStatus(status === id ? null : id);
              }}
            >
              {statusI18nKeys[id] || fallbackLabel}
            </Pill>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-4">
        <label htmlFor="maintenance-notes">
          {t('inspection:form.actions.maintenance_section.notesOptional')}
        </label>
        <Textarea
          id="maintenance-notes"
          placeholder={t('inspection:form.actions.maintenance_section.notesPlaceholder')}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className="lg:col-span-2 flex justify-end">
        {component && status && (
          <Button
            onClick={e => {
              e.preventDefault();
              onSave({
                type: 'MAINTENANCE',
                component,
                status,
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

export const MaintenanceView: React.FC<MaintenanceActionProps> = ({
  action,
  onSave,
  onRemove,
}) => {
  const { t } = useTranslation('inspection');
  const [isEditing, setIsEditing] = useState(false);

  if (!action) return null;

  const componentLabel =
    t(`inspection:form.actions.maintenance_section.${action.component === 'BOTTOM_BOARD' ? 'bottomBoard' : action.component === 'COVER' ? 'cover' : 'box'}`) ||
    getMaintenanceComponentLabel(action.component);

  const statusLabel =
    t(`inspection:form.actions.maintenance_section.${action.status === 'CLEANED' ? 'cleaned' : 'replaced'}`) ||
    getMaintenanceStatusLabel(action.status);

  const handleSave = (updatedAction: MaintenanceActionType) => {
    onSave(updatedAction);
    setIsEditing(false);
  };

  return isEditing ? (
    <MaintenanceForm
      action={action}
      onSave={handleSave}
      onRemove={onRemove}
    />
  ) : (
    <ActionViewRenderer
      title={t('inspection:form.actions.maintenance_section.title')}
      badges={
        <>
          <Badge>{componentLabel}</Badge>
          <Badge variant="outline">{statusLabel}</Badge>
        </>
      }
      notes={action.notes}
      onEdit={() => setIsEditing(true)}
      onRemove={() => onRemove('MAINTENANCE')}
    />
  );
};
