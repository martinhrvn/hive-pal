import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import NumericInputField from '@/components/common/numeric-input-field.tsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditIcon, TrashIcon } from 'lucide-react';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';

type TreatmentType = 'OXALIC_ACID' | 'FORMIC_ACID' | 'THYMOL' | 'OTHER';

export type TreatmentActionType = {
  type: 'TREATMENT';
  treatmentType: TreatmentType;
  amount: number;
  unit: string;
};

const TREATMENT_TYPES = [
  { id: 'OXALIC_ACID', label: 'Oxalic Acid' },
  { id: 'FORMIC_ACID', label: 'Formic Acid' },
  { id: 'THYMOL', label: 'Thymol' },
  { id: 'OTHER', label: 'Other' },
];

type TreatmentActionProps = {
  action?: TreatmentActionType;
  onSave: (action: TreatmentActionType) => void;
  onRemove: (action: 'TREATMENT') => void;
};

export const TreatmentForm: React.FC<TreatmentActionProps> = ({
  action,
  onSave,
}) => {
  const [amount, setAmount] = useState<number | null>(
    action?.amount ?? 10,
  );
  const [treatmentType, setTreatmentType] = useState<string>(
    action?.treatmentType ?? 'OXALIC_ACID',
  );
  
  const unit = 'ml';

  return (
    <div
      className={'grid grid-cols-2 gap-4 mt-5'}
      data-test={TEST_SELECTORS.TREATMENT_FORM}
    >
      <h3 className="col-span-2 text-lg font-bold">Treatment</h3>
      <div className={'flex flex-col gap-4'}>
        <label htmlFor={'treatment-type'}>Treatment Type</label>
        <Select
          value={treatmentType}
          onValueChange={val => setTreatmentType(val)}
        >
          <SelectTrigger className={'w-full'}>
            <SelectValue
              id={'treatment-type'}
              placeholder={'Select a treatment type'}
            >
              {TREATMENT_TYPES.find(t => t.id === treatmentType)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TREATMENT_TYPES.map(option => (
              <SelectItem
                key={option.id}
                value={option.id}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={'flex flex-col gap-4'}>
        <label htmlFor={'amount'}>Amount</label>
        <NumericInputField
          id={'amount'}
          step={5}
          min={0}
          value={amount}
          onChange={e => setAmount(e)}
          unit={unit}
        />
      </div>

      <div className="col-span-2 flex justify-end">
        {treatmentType && amount && (
          <Button
            onClick={() => {
              onSave({
                type: 'TREATMENT',
                treatmentType: treatmentType as TreatmentType,
                amount,
                unit,
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

export const TreatmentView: React.FC<TreatmentActionProps> = ({
  action,
  onSave,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!action) {
    return null;
  }
  
  const treatmentLabel = TREATMENT_TYPES.find(t => t.id === action.treatmentType)?.label;
  
  return isEditing ? (
    <TreatmentForm
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
      data-test={TEST_SELECTORS.TREATMENT_VIEW}
    >
      <div className={'flex flex-col gap-2'}>
        <h3 className="font-medium">Treatment</h3>
        <div className={'flex gap-5 text-sm'}>
          <Badge>{treatmentLabel}</Badge>
          <span>
            {action.amount}
            {action.unit}
          </span>
        </div>
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
          onClick={() => onRemove('TREATMENT')}
        >
          <TrashIcon />
        </Button>
      </div>
    </div>
  );
};