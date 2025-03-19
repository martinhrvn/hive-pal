import {
  Crown,
  Droplet,
  GitBranch,
  Grid,
  Layers,
  Pill,
  Scissors,
} from 'lucide-react';
import { useState } from 'react';
import {
  FeedingActionType,
  FeedingForm,
  FeedingView,
} from '@/pages/inspection/components/inspection-form/actions/feeding.tsx';
import { Button } from '@/components/ui/button';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';

const actionTypes = [
  { id: 'FEEDING', label: 'Feeding', Icon: Droplet },
  { id: 'TREATMENT', label: 'Treatment', Icon: Pill },
  { id: 'BOXES', label: 'Boxes', Icon: Layers },
  { id: 'FRAMES', label: 'Frames', Icon: Grid },
  { id: 'HARVEST', label: 'Harvest', Icon: Scissors },
  { id: 'REQUEENING', label: 'Requeening', Icon: Crown },
  { id: 'SPLIT', label: 'Split', Icon: GitBranch },
];

type ActionType = FeedingActionType;

export const ActionsSection: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionType[]>([]);
  const handleSave = (x: ActionType) => {
    setActions(actions => [...actions.filter(a => x.type !== a.type), x]);
    setSelectedAction(null);
  };

  const handleRemove = (x: ActionType['type']) =>
    setActions(actions => [...actions.filter(a => x !== a.type)]);
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

      {selectedAction && (
        <div>
          {selectedAction === 'FEEDING' && (
            <FeedingForm onSave={handleSave} onRemove={handleRemove} />
          )}
        </div>
      )}

      <div
        className="flex gap-4 divide-y"
        data-test={TEST_SELECTORS.SELECTED_ACTIONS}
      >
        {actions.map(action => {
          switch (action.type) {
            case 'FEEDING':
              return (
                <FeedingView
                  onSave={handleSave}
                  action={action}
                  onRemove={handleRemove}
                />
              );
          }
        })}
      </div>
    </div>
  );
};
