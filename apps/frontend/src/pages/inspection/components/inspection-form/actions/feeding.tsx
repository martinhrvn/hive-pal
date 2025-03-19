import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMemo, useState } from 'react';
import { Pill } from '@/components/common';
import NumericInputField from '@/components/common/numeric-input-field.tsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditIcon, TrashIcon } from 'lucide-react';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { Textarea } from '@/components/ui/textarea';

type FeedType = 'SYRUP' | 'HONEY' | 'CANDY';

export type FeedingActionType = {
  type: 'FEEDING';
  feedType: FeedType;
  quantity: number;
  unit: string;
  concentration?: string;
  notes?: string;
};

const FEED_TYPES = [
  { id: 'SYRUP', label: 'Syrup' },
  { id: 'HONEY', label: 'Honey' },
  { id: 'CANDY', label: 'Candy' },
];

const CONCENTRATIONS = ['1:1', '2:1', '3:2'];

type FeedingActionProps = {
  action?: FeedingActionType;
  onSave: (action: FeedingActionType) => void;
  onRemove: (action: 'FEEDING') => void;
};
export const FeedingForm: React.FC<FeedingActionProps> = ({
  action,
  onSave,
}) => {
  const [quantity, setQuantity] = useState<number | null>(
    action?.quantity ?? 100,
  );
  const [concentration, setConcentration] = useState<string>(
    action?.concentration ?? '1:1'
  );
  const [feedType, setFeedType] = useState<FeedType | null>(
    action?.feedType ?? 'SYRUP',
  );
  const [notes, setNotes] = useState<string>(action?.notes ?? '');
  
  const showConcentration = feedType === 'SYRUP';
  const units = useMemo(() => {
    switch (feedType) {
      case 'SYRUP':
        return 'ml';
      default:
        return 'g';
    }
  }, [feedType]);
  return (
    <div
      className={'grid grid-cols-2 gap-4 mt-5'}
      data-test={TEST_SELECTORS.FEEDING_FORM}
    >
      <h3 className="col-span-2 text-lg font-bold">Feeding</h3>
      <div className="col-span-2 flex flex-col gap-4">
        <label>Feed type</label>
        <div className="flex gap-4">
          {FEED_TYPES.map(({ id, label }) => (
            <Pill
              key={id}
              color={'blue'}
              active={feedType === id}
              onClick={e => {
                e.preventDefault();
                if (feedType === id) {
                  setFeedType(null);
                } else {
                  setFeedType(id as FeedType);
                }
              }}
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>
      {feedType && (
        <div className={'flex flex-col gap-4'}>
          <label htmlFor={'quantity'}>Quantity</label>
          <NumericInputField
            id={'quantity'}
            step={100}
            min={0}
            value={quantity}
            onChange={e => setQuantity(e)}
            unit={units}
          />
        </div>
      )}

      <div className={'flex flex-col gap-4'}>
        {showConcentration && (
          <>
            <label htmlFor={'concentration'}>Concentration</label>
            <Select
              value={concentration}
              onValueChange={val => setConcentration(val)}
            >
              <SelectTrigger className={'w-full'}>
                <SelectValue
                  id={'concentration'}
                  placeholder={'Select a concentration'}
                >
                  {concentration}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CONCENTRATIONS.map(option => (
                  <SelectItem
                    key={option}
                    value={option}
                    onSelect={() => setConcentration(option)}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      <div className="col-span-2 flex flex-col gap-4">
        <label htmlFor="notes">Notes (optional)</label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes about this feeding"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          data-test={TEST_SELECTORS.FEEDING_NOTES}
        />
      </div>

      <div className="col-span-2 flex justify-end">
        {feedType && quantity && (
          <Button
            onClick={() => {
              onSave({
                type: 'FEEDING',
                feedType: feedType,
                quantity,
                concentration,
                unit: units,
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

export const FeedingView: React.FC<FeedingActionProps> = ({
  action,
  onSave,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!action) {
    return null;
  }
  return isEditing ? (
    <FeedingForm
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
      data-test={TEST_SELECTORS.FEEDING_VIEW}
    >
      <div className={'flex flex-col gap-2'}>
        <h3 className="font-medium">Feeding</h3>
        <div className={'flex gap-5 text-sm'}>
          <Badge>{action.feedType}</Badge>
          <span>
            {action.quantity}
            {action.unit}
          </span>
          <span>{action.concentration}</span>
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
          onClick={() => onRemove('FEEDING')}
        >
          <TrashIcon />
        </Button>
      </div>
    </div>
  );
};
