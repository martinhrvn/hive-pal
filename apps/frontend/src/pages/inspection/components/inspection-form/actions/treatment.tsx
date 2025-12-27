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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useUnitFormat } from '@/hooks/use-unit-format';
import {
  parseVolume,
  parseMass,
  formatTreatmentQuantity,
  getTreatmentDisplayUnit,
} from '@/utils/unit-conversion';
import {
  TREATMENT_PRODUCTS,
  TREATMENT_UNITS,
  TreatmentProductId,
} from 'shared-schemas';

export type TreatmentActionType = {
  type: 'TREATMENT';
  treatmentType: string;
  amount: number | null;
  unit: string;
  notes?: string;
};

type TreatmentActionProps = {
  action?: TreatmentActionType;
  onSave: (action: TreatmentActionType) => void;
  onRemove: (action: 'TREATMENT') => void;
};

export const TreatmentForm: React.FC<TreatmentActionProps> = ({
  action,
  onSave,
}) => {
  const { unitPreference } = useUnitFormat();

  // Get initial values from action or defaults
  const getInitialUnit = (): string => {
    if (action?.unit) return action.unit;
    const config = TREATMENT_PRODUCTS[action?.treatmentType as TreatmentProductId];
    return config?.defaultUnit ?? 'ml';
  };

  const [treatmentType, setTreatmentType] = useState<string>(
    action?.treatmentType ?? 'OXALIC_ACID',
  );
  const [customProductName, setCustomProductName] = useState<string>(
    // If treatmentType is not in TREATMENT_PRODUCTS, it's a custom name
    action?.treatmentType && !(action.treatmentType in TREATMENT_PRODUCTS)
      ? action.treatmentType
      : '',
  );
  const [unit, setUnit] = useState<string>(getInitialUnit());
  const [amount, setAmount] = useState<number | null>(action?.amount ?? 1);
  const [notes, setNotes] = useState<string>(action?.notes ?? '');

  // Get config for current treatment type
  const currentConfig = TREATMENT_PRODUCTS[treatmentType as TreatmentProductId];
  const requiresQuantity = currentConfig?.requiresQuantity ?? true;
  const isOther = treatmentType === 'OTHER';

  // Get display unit based on storage unit and user preference
  const displayUnit = getTreatmentDisplayUnit(unit, unitPreference);

  const handleTreatmentTypeChange = (newType: string) => {
    setTreatmentType(newType);
    const config = TREATMENT_PRODUCTS[newType as TreatmentProductId];
    if (config) {
      setUnit(config.defaultUnit);
      if (!config.requiresQuantity) {
        setAmount(null);
      } else if (amount === null) {
        setAmount(1);
      }
    }
    // Clear custom name when switching away from OTHER
    if (newType !== 'OTHER') {
      setCustomProductName('');
    }
  };

  const handleSave = () => {
    // Determine the product name to store
    const product = isOther ? customProductName : treatmentType;

    // Convert user input to metric for storage
    let apiAmount = amount;
    if (amount !== null) {
      if (unit === 'ml' && unitPreference === 'imperial') {
        // User entered fl oz, convert to ml
        const volumeInLiters = parseVolume(amount, 'fl oz', unitPreference);
        apiAmount = volumeInLiters * 1000;
      } else if (unit === 'g' && unitPreference === 'imperial') {
        // User entered oz, convert to g
        apiAmount = parseMass(amount, 'oz', unitPreference);
      }
      // pcs doesn't need conversion
    }

    onSave({
      type: 'TREATMENT',
      treatmentType: product,
      amount: requiresQuantity ? apiAmount : null,
      unit,
      notes: notes.trim() || undefined,
    });
  };

  // Validate form: need treatment type (and custom name if OTHER) and amount if required
  const isValid =
    treatmentType &&
    (!isOther || customProductName.trim()) &&
    (!requiresQuantity || (amount !== null && amount > 0));

  return (
    <div
      className={'grid grid-cols-2 gap-4 mt-5'}
      data-test={TEST_SELECTORS.TREATMENT_FORM}
    >
      <h3 className="col-span-2 text-lg font-bold">Treatment</h3>

      {/* Treatment Type Selector */}
      <div className={'col-span-2 lg:col-span-1 flex flex-col gap-4'}>
        <label htmlFor={'treatment-type'}>Treatment Type</label>
        <Select value={treatmentType} onValueChange={handleTreatmentTypeChange}>
          <SelectTrigger className={'w-full'}>
            <SelectValue
              id={'treatment-type'}
              placeholder={'Select a treatment type'}
            >
              {TREATMENT_PRODUCTS[treatmentType as TreatmentProductId]?.label ??
                treatmentType}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TREATMENT_PRODUCTS).map(([id, config]) => (
              <SelectItem key={id} value={id}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Product Name (shown only for OTHER) */}
      {isOther && (
        <div className={'col-span-2 lg:col-span-1 flex flex-col gap-4'}>
          <label htmlFor={'custom-product'}>Product Name</label>
          <Input
            id={'custom-product'}
            placeholder={'Enter treatment product name'}
            value={customProductName}
            onChange={e => setCustomProductName(e.target.value)}
          />
        </div>
      )}

      {/* Unit Selector */}
      <div
        className={`${isOther ? 'col-span-2 lg:col-span-1' : 'col-span-2 lg:col-span-1'} flex flex-col gap-4`}
      >
        <label htmlFor={'unit'}>Unit</label>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className={'w-full'}>
            <SelectValue id={'unit'} placeholder={'Select unit'}>
              {displayUnit}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TREATMENT_UNITS.map(u => (
              <SelectItem key={u} value={u}>
                {getTreatmentDisplayUnit(u, unitPreference)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount (conditionally shown based on requiresQuantity) */}
      {requiresQuantity && (
        <div className={'col-span-2 lg:col-span-1 flex flex-col gap-4'}>
          <label htmlFor={'amount'}>Amount</label>
          <NumericInputField
            id={'amount'}
            step={unit === 'pcs' ? 1 : 5}
            min={0}
            value={amount}
            onChange={e => setAmount(e)}
            unit={displayUnit}
          />
        </div>
      )}

      {/* Notes */}
      <div className="col-span-2 flex flex-col gap-4">
        <label htmlFor="notes">Notes (optional)</label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes about this treatment"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          data-test={TEST_SELECTORS.TREATMENT_NOTES}
        />
      </div>

      {/* Save Button */}
      <div className="col-span-2 flex justify-end">
        {isValid && <Button onClick={handleSave}>Save</Button>}
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
  const { unitPreference } = useUnitFormat();

  if (!action) {
    return null;
  }

  // Get treatment label - either from TREATMENT_PRODUCTS or use raw value for custom
  const treatmentLabel =
    TREATMENT_PRODUCTS[action.treatmentType as TreatmentProductId]?.label ??
    action.treatmentType;

  // Format the quantity display based on unit type and user preference
  const getDisplayValue = () => {
    if (action.amount === null || action.amount === undefined) {
      return null; // No quantity to display
    }
    return formatTreatmentQuantity(action.amount, action.unit, unitPreference)
      .label;
  };

  const displayValue = getDisplayValue();

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
          {displayValue && <span>{displayValue}</span>}
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
          onClick={() => onRemove('TREATMENT')}
        >
          <TrashIcon />
        </Button>
      </div>
    </div>
  );
};
