import { Droplet, Grid, Pill } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { useFormContext } from 'react-hook-form';
import { ActionData, InspectionFormData } from './schema.ts';

const actionTypes = [
  { id: 'FEEDING', label: 'Feeding', Icon: Droplet },
  { id: 'TREATMENT', label: 'Treatment', Icon: Pill },
  { id: 'FRAMES', label: 'Frames', Icon: Grid },
];

export type OtherActionType = {
  type: 'OTHER';
  notes: string;
};

export type ActionType =
  | FeedingActionType
  | TreatmentActionType
  | FramesActionType
  | OtherActionType;

export const ActionsSection: React.FC = () => {
  const { setValue, getValues, watch, formState } =
    useFormContext<InspectionFormData>();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Watch for changes to the actions array in the form
  const formActions = watch('actions') || [];

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

  const renderActionForm = useMemo(() => {
    if (!selectedAction) return null;

    switch (selectedAction) {
      case 'FEEDING':
        return <FeedingForm onSave={handleSave} onRemove={handleRemove} />;
      case 'TREATMENT':
        return <TreatmentForm onSave={handleSave} onRemove={handleRemove} />;
      case 'FRAMES':
        return <FramesForm onSave={handleSave} onRemove={handleRemove} />;
      default:
        return null;
    }
  }, [selectedAction, handleSave, handleRemove]);

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
      case 'FRAMES':
        return (
          <FramesView
            key="frames"
            onSave={handleSave}
            action={action}
            onRemove={handleRemove}
          />
        );
    }
  };

  return (
    <div>
      <h3 className={'text-lg my-4 font-medium'}>Actions</h3>
      <div
        data-test={TEST_SELECTORS.ACTION_BUTTONS}
        className="flex flex-wrap gap-2"
      >
        {actionTypes.map(({ id, label, Icon }) => {
          if (formActions.some(a => a.type === id)) return null;
          return (
            <Button
              size={'sm'}
              onClick={e => {
                e.preventDefault();
                setSelectedAction(id);
              }}
              key={id}
            >
              <Icon size={16} />
              {label}
            </Button>
          );
        })}
      </div>

      {renderActionForm && <div>{renderActionForm}</div>}
      {formState.errors.actions && (
        <div className="text-red-500">{formState.errors.actions.message}</div>
      )}
      <div
        className="flex flex-col divide-y"
        data-test={TEST_SELECTORS.SELECTED_ACTIONS}
      >
        {formActions.map((action, index) => (
          <div key={`${action.type}-${index}`}>
            {renderActionView(action as ActionType)}
          </div>
        ))}
      </div>
    </div>
  );
};
