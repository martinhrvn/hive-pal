import { useTranslation } from 'react-i18next';
import {
  ArrowLeftRight,
  Droplet,
  Grid,
  Pill,
  StickyNote,
  Wrench,
} from 'lucide-react';
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
  StatusChangeActionType,
  StatusChangeForm,
  StatusChangeView,
} from '@/pages/inspection/components/inspection-form/actions/status-change.tsx';
import {
  BoxConfigurationAction,
  BoxConfigurationView,
} from '@/pages/inspection/components/inspection-form/actions/box-configuration.tsx';
import { Button } from '@/components/ui/button';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { useFormContext } from 'react-hook-form';
import { ActionData, BoxConfigurationActionData, InspectionFormData } from './schema.ts';
import {
  ActionType as ActionTypeEnum,
  HiveStatus as HiveStatusEnum,
} from 'shared-schemas';
import { AiBadge } from './ai-badge';
import type {
  AiFieldSuggestion,
  AiMergeState,
} from '@/pages/inspection/lib/inspection-ai-merge';
import { cn } from '@/lib/utils';
import { isAiActionField } from '@/pages/inspection/lib/inspection-ai-draft';
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
  | StatusChangeActionType
  | OtherActionType
  | BoxConfigurationActionData;

interface ActionsSectionProps {
  editMode?: boolean;
  isAiSuggested?: (field: string) => boolean;
  aiMergeState?: AiMergeState | null;
  onAcceptSuggestion?: (field: string) => void;
  onDismissSuggestion?: (field: string) => void;
  /** Current hive boxes — needed to seed the box configurator */
  hiveBoxes?: Box[];
  /** The hive's id — passed through to the box configurator */
  hiveId?: string;
  /** Brood-box frame count excluding this inspection's frame action */
  baseBroodFrames?: number | null;
  /** Total brood-box frame capacity (sum of maxFrameCount) */
  broodFrameCapacity?: number | null;
  /** Hide the Box Configuration action option — it's per-hive and doesn't
   *  make sense in bulk-create flows where the same form is applied to many
   *  hives. */
  disableBoxConfig?: boolean;
  /** Enable the "Change Status" action option (inspection form only). */
  enableStatusChange?: boolean;
  /** The hive's current status — used to seed and label the status change. */
  hiveStatus?: HiveStatusEnum;
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
    case 'STATUS_CHANGE':
      return t('inspection:form.actions.statusChange', 'Change Status');
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

const formatActionDetails = (action: Record<string, unknown>): string => {
  const entries = Object.entries(action).filter(
    ([key, value]) =>
      key !== 'type' &&
      value !== undefined &&
      value !== null &&
      !(typeof value === 'string' && value.trim() === ''),
  );

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join('\n');
};

const AiActionSuggestionCard = ({
  suggestion,
  t,
  onAccept,
  onDismiss,
}: {
  suggestion: AiFieldSuggestion;
  t: ReturnType<typeof useTranslation>['t'];
  onAccept?: (field: string) => void;
  onDismiss?: (field: string) => void;
}) => {
  const { t: tAi } = useTranslation('ai');
  const action = getActionRecord(suggestion.aiValue);

  if (!action) return null;

  const actionType = getActionType(action);
  const details = formatActionDetails(action);

  return (
    <div
      data-ai-field={suggestion.field}
      className="rounded-md border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-900 dark:bg-blue-950/20"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="font-medium">
          {formatActionTypeLabel(actionType, t)}
        </span>
        <AiBadge />
      </div>

      {details && (
        <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
          {details}
        </pre>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span
          className={
            suggestion.hasConflict
              ? 'text-xs text-amber-600'
              : 'text-xs text-blue-600'
          }
        >
          {suggestion.hasConflict
            ? tAi('suggestion.conflict')
            : tAi('suggestion.willFill')}
        </span>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onAccept?.(suggestion.field)}
        >
          {tAi('preview.accept')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onDismiss?.(suggestion.field)}
        >
          {tAi('preview.dismiss')}
        </Button>
      </div>
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
  disableBoxConfig = false,
  enableStatusChange = false,
  hiveStatus,
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
    STATUS_CHANGE: t('inspection:form.actions.statusChange', 'Change Status'),
    BOX_CONFIGURATION: 'Box Configuration',
  };

  const availableActionTypes = enableStatusChange
    ? [
        ...actionTypes,
        {
          id: 'STATUS_CHANGE',
          label: 'Change Status',
          Icon: ArrowLeftRight,
        },
      ]
    : actionTypes;

  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const formActions = watch('actions') || [];

  // Each AI-suggested action is its own suggestion ("actions.<i>") so the
  // user can accept or dismiss them individually.
  const actionSuggestions = Object.values(
    aiMergeState?.suggestions ?? {},
  ).filter(
    suggestion =>
      isAiActionField(suggestion.field) &&
      (isAiSuggested?.(suggestion.field) ?? true),
  );

  const pendingActionSuggestions = actionSuggestions.filter(
    suggestion => suggestion.status === 'pending',
  );
  const isPending = pendingActionSuggestions.length > 0;

  const visibleActionTypes = new Set([
    ...formActions
      .map(action => action.type)
      .filter(type => typeof type === 'string'),
    ...pendingActionSuggestions
      .map(suggestion => getActionType(suggestion.aiValue))
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
      case 'STATUS_CHANGE':
        return (
          <StatusChangeForm
            onSave={handleSave}
            onRemove={handleRemove}
            currentStatus={hiveStatus}
          />
        );
      default:
        return null;
    }
  }, [
    selectedAction,
    handleSave,
    handleRemove,
    baseBroodFrames,
    broodFrameCapacity,
    hiveStatus,
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
      case 'STATUS_CHANGE':
        return (
          <StatusChangeView
            key="status-change"
            onSave={handleSave}
            action={action}
            onRemove={handleRemove}
            currentStatus={hiveStatus}
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
            onRemove={() => handleRemove(ActionTypeEnum.BOX_CONFIGURATION)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
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
        {actionSuggestions.length > 0 && <AiBadge />}
      </h3>

      {pendingActionSuggestions.length > 0 && (
        <div className="mb-4 space-y-3">
          {pendingActionSuggestions.map(suggestion => (
            <AiActionSuggestionCard
              key={suggestion.field}
              suggestion={suggestion}
              t={t}
              onAccept={onAcceptSuggestion}
              onDismiss={onDismissSuggestion}
            />
          ))}
        </div>
      )}

      {!editMode && (
        <div
          data-test={TEST_SELECTORS.ACTION_BUTTONS}
          className="flex flex-wrap gap-2"
        >
          {availableActionTypes.map(({ id, label, Icon }) => {
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

          {!disableBoxConfig && (
            <BoxConfigurationAction
              initialBoxes={hiveBoxes}
              hiveId={hiveId}
              onSave={handleBoxConfigSave}
              onRemove={() => handleRemove(ActionTypeEnum.BOX_CONFIGURATION)}
              existingAction={existingBoxConfigAction}
            />
          )}
        </div>
      )}

      {renderActionForm && <div>{renderActionForm}</div>}

      {formState.errors.actions && (
        <div className="text-red-500">{formState.errors.actions.message}</div>
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
