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

const actionTypes = [
  { id: 'FEEDING', label: 'Feeding', Icon: Droplet },
  { id: 'TREATMENT', label: 'Treatment', Icon: Pill },
  { id: 'FRAMES', label: 'Frames', Icon: Grid },
];

type ActionType = FeedingActionType | TreatmentActionType | FramesActionType;

export const ActionsSection: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionType[]>([]);
  const handleSave = useCallback((x: ActionType) => {
    setActions(actions => [...actions.filter(a => x.type !== a.type), x]);
    setSelectedAction(null);
  }, []);

  const handleRemove = useCallback(
    (x: ActionType['type']) =>
      setActions(actions => [...actions.filter(a => x !== a.type)]),
    [],
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
          if (actions.some(a => a.type === id)) return null;
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

      <div
        className="flex gap-4 divide-y"
        data-test={TEST_SELECTORS.SELECTED_ACTIONS}
      >
        {actions.map(action => renderActionView(action))}
      </div>
    </div>
  );
};
