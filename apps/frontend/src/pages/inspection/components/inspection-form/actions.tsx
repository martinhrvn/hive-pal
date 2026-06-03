import { useTranslation } from 'react-i18next';
import { Droplet, Grid, Pill, StickyNote, Wrench } from 'lucide-react';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  FeedingActionType,
  FeedingForm,
  FeedingView,
} from '@/pages/inspection/components/inspection-form/actions/feeding.tsx';
import {
  TreatmentActionType,
  TreatmentForm,
  TreatmentView,
} from '@/pages/inspection/components/inspection-form/actions/treatment.tsx';
import {
  FramesActionType,
  FramesForm,
  FramesView,
} from '@/pages/inspection/components/inspection-form/actions/frames.tsx';
import {
  NoteActionType,
  NoteForm,
  NoteView,
} from '@/pages/inspection/components/inspection-form/actions/note.tsx';
import {
  MaintenanceActionType,
  MaintenanceForm,
  MaintenanceView,
} from '@/pages/inspection/components/inspection-form/actions/maintenance.tsx';
import {
  BoxConfigurationAction,
  BoxConfigurationView,
} from '@/pages/inspection/components/inspection-form/actions/box-configuration.tsx';
import { Button } from '@/components/ui/button';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { useFormContext } from 'react-hook-form';
import { ActionData, BoxConfigurationActionData, InspectionFormData } from './schema.ts';
import { AiBadge } from './ai-badge';
import { AiSectionPreview } from './ai-section-preview';
import type { AiMergeState } from '@/pages/inspection/lib/inspection-ai-merge';
import { cn } from '@/lib/utils';
import { shouldUseAiPrefill } from '@/pages/inspection/lib/inspection-ai-merge';
import type { Box } from 'shared-schemas';

const actionTypes = [
  { id: 'FEEDING', label: 'Feeding', Icon: Droplet },
  { id: 'TREATMENT', label: 'Treatment', Icon: Pill },
  { id: 'FRAME', label: 'Frames', Icon: Grid },
  { id: 'MAINTENANCE', label: 'Maintenance', Icon: Wrench },
  { id: 'NOTE', label: 'Note', Icon: StickyNote },
];

export type OtherActionType = {
  type: 'OTHER';
  notes: string;
};

export type ActionType =
  | FeedingActionType
  | TreatmentActionType
  | FramesActionType
  | MaintenanceActionType
  | NoteActionType
  | OtherActionType
  | BoxConfigurationActionData;

interface ActionsSectionProps {
  editMode?: boolean;
  isAiSuggested?: (field: keyof InspectionFormData) => boolean;
  aiMergeState?: AiMergeState | null;
  onAcceptSuggestion?: (field: keyof InspectionFormData) => void;
  onDismissSuggestion?: (field: keyof InspectionFormData) => void;
  /** Current hive boxes — needed to seed the box configurator */
  hiveBoxes?: Box[];
  /** The hive's id — passed through to the box configurator */
  hiveId?: string;
  /** Brood-box frame count excluding this inspection's frame action */
  baseBroodFrames?: number | null;
  /** Total brood-box frame capacity (sum of maxFrameCount) */
  broodFrameCapacity?: number | null;
}

const formatActionTypeLabel = (
  type: string,
  t: ReturnType<typeof useTranslation>['t'],
) => {
  switch (type) {
    case 'FEEDING':
      return t('inspection:form.actions.feeding');
    case 'TREATMENT':
      return t('inspection:form.actions.treatment');
    case 'FRAME':
      return t('inspection:form.actions.frames');
    case 'MAINTENANCE':
      return t('inspection:form.actions.maintenance');
    case 'NOTE':
      return t('inspection:form.actions.note');
    case 'BOX_CONFIGURATION':
      return 'Box Configuration';
    case 'OTHER':
      return t('inspection:form.actions.other', 'Other');
    default:
      return type;
  }
};

const getActionRecord = (action: unknown): Record<string, unknown> | null => {
  return action && typeof action === 'object'
    ? (action as Record<string, unknown>)
    : null;
};

const getActionType = (action: unknown): string => {
  const record = getActionRecord(action);
  return typeof record?.type === 'string' ? record.type : 'UNKNOWN';
};

const getActionKey = (action: unknown, index: number): string => {
  return `${getActionType(action)}-${index}`;
};

const formatActionsPreview = (
  value: unknown,
  t: ReturnType<typeof useTranslation>['t'],
): ReactNode => {
  if (!Array.isArray(value) || value.length === 0) {
    return <span className="italic text-muted-foreground">No actions</span>;
  }

  return (
    <div className="space-y-2">
      {value.map((action, index) => {
        const typedAction = getActionRecord(action);

        if (!typedAction) {
          return (
            <div
              key={`invalid-${index}`}
              className="rounded border bg-muted/20 p-2 text-xs text-muted-foreground"
            >
              Invalid action
            </div>
          );
        }

        const actionType = getActionType(action);

        return (
          <div
            key={getActionKey(action, index)}
            className="rounded border bg-muted/20 p-2 text-sm"
          >
            <div className="font-medium">
              {formatActionTypeLabel(actionType, t)}
            </div>
            <pre className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
              {JSON.stringify(action, null, 2)}
            </pre>
          </div>
        );
      })}
    </div>
  );
};

const PendingAiActionCard = ({
  action,
  t,
}: {
  action: Record<string, unknown>;
  t: ReturnType<typeof useTranslation>['t'];
}) => {
  const actionType = getActionType(action);

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-900 dark:bg-blue-950/20">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-medium">
          {formatActionTypeLabel(actionType, t)}
        </span>
        <AiBadge />
      </div>
      <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
        {JSON.stringify(action, null, 2)}
      </pre>
    </div>
  );
};

export const ActionsSection: React.FC<ActionsSectionProps> = ({
  editMode = false,
  isAiSuggested,
  aiMergeState,
  onAcceptSuggestion,
  onDismissSuggestion,
  hiveBoxes = [],
  hiveId,
  baseBroodFrames,
  broodFrameCapacity,
}) => {
  const { t } = useTranslation('inspection');
  const { setValue, getValues, watch, formState } =
    useFormContext<InspectionFormData>();

  const actionLabels: Record<string, string> = {
    FEEDING: t('inspection:form.actions.feeding'),
    TREATMENT: t('inspection:form.actions.treatment'),
    FRAME: t('inspection:form.actions.frames'),
    MAINTENANCE: t('inspection:form.actions.maintenance'),
    NOTE: t('inspection:form.actions.note'),
    BOX_CONFIGURATION: 'Box Configuration',
  };

  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const formActions = watch('actions') || [];
  const actionsSuggestion = isAiSuggested?.('actions')
    ? aiMergeState?.suggestions.actions
    : undefined;
  const isPending = actionsSuggestion?.status === 'pending';
  const isDirty = Boolean(formState.dirtyFields.actions);

  const previewActions =
    actionsSuggestion &&
    shouldUseAiPrefill(formActions, isDirty, actionsSuggestion) &&
    Array.isArray(actionsSuggestion.aiValue)
      ? (actionsSuggestion.aiValue as Record<string, unknown>[])
      : [];

  const visibleActionTypes = new Set([
    ...formActions
      .map(action => action.type)
      .filter((type): type is string => typeof type === 'string'),
    ...previewActions
      .map(action => getActionType(action))
      .filter(type => type !== 'UNKNOWN'),
  ]);

  const handleSave = useCallback(
    (action: ActionType) => {
      const currentActions = getValues('actions') || [];
      const updatedActions = [
        ...currentActions.filter(a => a.type !== action.type),
        action as ActionData,
      ];

      setValue('actions', updatedActions, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setSelectedAction(null);
    },
    [getValues, setValue],
  );

  const handleRemove = useCallback(
    (actionType: ActionType['type']) => {
      const currentActions = getValues('actions') || [];
      setValue(
        'actions',
        currentActions.filter(a => a.type !== actionType),
        { shouldDirty: true, shouldTouch: true },
      );
    },
    [getValues, setValue],
  );

  // Specific save handler for box configuration — same logic but typed
  const handleBoxConfigSave = useCallback(
    (action: BoxConfigurationActionData) => {
      handleSave(action);
    },
    [handleSave],
  );

  const existingBoxConfigAction = formActions.find(
    a => a.type === 'BOX_CONFIGURATION',
  );

  const renderActionForm = useMemo(() => {
    if (!selectedAction) return null;

    switch (selectedAction) {
      case 'FEEDING':
        return <FeedingForm onSave={handleSave} onRemove={handleRemove} />;
      case 'TREATMENT':
        return <TreatmentForm onSave={handleSave} onRemove={handleRemove} />;
      case 'FRAME':
        return (
          <FramesForm
            onSave={handleSave}
            onRemove={handleRemove}
            baseBroodFrames={baseBroodFrames}
            broodFrameCapacity={broodFrameCapacity}
          />
        );
      case 'MAINTENANCE':
        return <MaintenanceForm onSave={handleSave} onRemove={handleRemove} />;
      case 'NOTE':
        return <NoteForm onSave={handleSave} onRemove={handleRemove} />;
      default:
        return null;
    }
  }, [
    selectedAction,
    handleSave,
    handleRemove,
    baseBroodFrames,
    broodFrameCapacity,
  ]);

  const renderActionView = (action: ActionType): ReactNode => {
    switch (action.type) {
      case 'FEEDING':
        return (
          <FeedingView
            key="feeding"
            onSave={handleSave}
            action={action}
            onRemove={handleRemove}
          />
        );
      case 'TREATMENT':
        return (
          <TreatmentView
            key="treatment"
            onSave={handleSave}
            action={action}
            onRemove={handleRemove}
          />
        );
      case 'FRAME':
        return (
          <FramesView
            key="frames"
            onSave={handleSave}
            action={action}
            onRemove={handleRemove}
            baseBroodFrames={baseBroodFrames}
            broodFrameCapacity={broodFrameCapacity}
          />
        );
      case 'MAINTENANCE':
        return (
          <MaintenanceView
            key="maintenance"
            onSave={handleSave}
            action={action}
            onRemove={handleRemove}
          />
        );
      case 'NOTE':
        return (
          <NoteView
            key="note"
            onSave={handleSave}
            action={action}
            onRemove={handleRemove}
          />
        );
      case 'OTHER':
        return (
          <NoteView
            key="other"
            onSave={handleSave}
            action={{ type: 'NOTE', notes: action.notes }}
            onRemove={() => handleRemove('OTHER')}
          />
        );
      case 'BOX_CONFIGURATION':
        return (
          <BoxConfigurationView
            key="box-configuration"
            action={action as BoxConfigurationActionData}
            onRemove={() => handleRemove('BOX_CONFIGURATION')}
          />
        );
      default:
        return null;
    }
  };

  const actionsSummary = actionsSuggestion?.aiValue;
  const suggestedCount = Array.isArray(actionsSummary) ? actionsSummary.length : 0;

  return (
    <div
      data-ai-field="actions"
      className={cn(
        'rounded-md p-3 transition-colors',
        isPending &&
          'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
      )}
    >
      <h3 className="my-4 flex items-center gap-2 text-lg font-medium">
        <span>
          {editMode
            ? t('inspection:form.actions.titleSingular')
            : t('inspection:form.actions.title')}
        </span>
        {actionsSuggestion && <AiBadge />}
      </h3>

      {actionsSuggestion && (
        <AiSectionPreview
          title={t('inspection:form.actions.title')}
          summary={
            suggestedCount > 0
              ? `${suggestedCount} AI-suggested action${suggestedCount === 1 ? '' : 's'}`
              : 'Review AI-suggested actions before applying them.'
          }
          currentValue={formatActionsPreview(formActions, t)}
          suggestedValue={formatActionsPreview(actionsSuggestion.aiValue, t)}
          hasConflict={actionsSuggestion.hasConflict}
          status={actionsSuggestion.status}
          onAccept={() => onAcceptSuggestion?.('actions')}
          onDismiss={() => onDismissSuggestion?.('actions')}
        />
      )}

      {!editMode && (
        <div
          data-test={TEST_SELECTORS.ACTION_BUTTONS}
          className="flex flex-wrap gap-2"
        >
          {actionTypes.map(({ id, label, Icon }) => {
            if (visibleActionTypes.has(id)) return null;

            return (
              <Button
                size="sm"
                type="button"
                onClick={e => {
                  e.preventDefault();
                  setSelectedAction(id);
                }}
                key={id}
              >
                <Icon size={16} />
                {actionLabels[id] || label}
              </Button>
            );
          })}

          {/* Box Configuration — always visible; opens the sheet */}
          <BoxConfigurationAction
            initialBoxes={hiveBoxes}
            hiveId={hiveId}
            onSave={handleBoxConfigSave}
            onRemove={() => handleRemove('BOX_CONFIGURATION')}
            existingAction={existingBoxConfigAction}
          />
        </div>
      )}

      {renderActionForm && <div>{renderActionForm}</div>}

      {formState.errors.actions && (
        <div className="text-red-500">{formState.errors.actions.message}</div>
      )}

      {previewActions.length > 0 && (
        <div className="mt-4 space-y-3">
          {previewActions.map((action, index) => (
            <PendingAiActionCard
              key={`ai-preview-${getActionKey(action, index)}`}
              action={action}
              t={t}
            />
          ))}
        </div>
      )}

      <div
        className="flex flex-col divide-y"
        data-test={TEST_SELECTORS.SELECTED_ACTIONS}
      >
        {formActions
          .filter(a => a.type !== 'BOX_CONFIGURATION') // rendered via BoxConfigurationAction above
          .map((action, index) => (
            <div key={`${action.type}-${index}`}>
              {renderActionView(action as ActionType)}
            </div>
          ))}
      </div>
    </div>
  );
};
