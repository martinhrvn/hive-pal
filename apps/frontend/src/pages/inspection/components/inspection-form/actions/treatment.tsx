import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import NumericInputField from '@/components/common/numeric-input-field.tsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useUnitFormat } from '@/hooks/use-unit-format';
import { useTreatmentProducts } from '@/api/hooks';
import {
  parseVolume,
  parseMass,
  formatTreatmentQuantity,
  getTreatmentDisplayUnit,
} from '@/utils/unit-conversion';
import { TREATMENT_UNITS } from 'shared-schemas';
import { ActionViewRenderer } from './action-view-container';

const MITE_METHODS = [
  'NATURAL_DROP',
  'SUGAR_ROLL',
  'ALCOHOL_WASH',
  'CO2',
  'OTHER',
] as const;

export type TreatmentActionType = {
  type: 'TREATMENT';
  treatmentType: string;
  productId?: string | null;
  amount: number | null;
  unit: string;
  notes?: string;
  miteCountMethod?: string | null;
  miteCountBefore?: number | null;
  miteCountAfter?: number | null;
  miteSampleSize?: number | null;
};

type TreatmentActionProps = {
  action?: TreatmentActionType;
  onSave: (action: TreatmentActionType) => void;
  onRemove: (action: 'TREATMENT') => void;
};

const OTHER = 'OTHER';

export const TreatmentForm: React.FC<TreatmentActionProps> = ({
  action,
  onSave,
}) => {
  const { t } = useTranslation('inspection');
  const { unitPreference } = useUnitFormat();
  const { data: products } = useTreatmentProducts();

  // Resolve initial selection: prefer the linked productId, then a name match, else custom.
  const initialSelection = useMemo(() => {
    if (action?.productId) return action.productId;
    if (action?.treatmentType && products) {
      const byName = products.find((p) => p.name === action.treatmentType);
      if (byName) return byName.id;
    }
    return action?.treatmentType ? OTHER : '';
  }, [action?.productId, action?.treatmentType, products]);

  const [selectedId, setSelectedId] = useState<string>(initialSelection);
  const [customProductName, setCustomProductName] = useState<string>(
    action?.productId ? '' : (action?.treatmentType ?? ''),
  );
  const [unit, setUnit] = useState<string>(action?.unit ?? 'ml');
  const [amount, setAmount] = useState<number | null>(action?.amount ?? 1);
  const [notes, setNotes] = useState<string>(action?.notes ?? '');
  const [showEfficacy, setShowEfficacy] = useState<boolean>(
    action?.miteCountBefore != null || action?.miteCountAfter != null,
  );
  const [miteMethod, setMiteMethod] = useState<string>(
    action?.miteCountMethod ?? '',
  );
  const [miteBefore, setMiteBefore] = useState<number | null>(
    action?.miteCountBefore ?? null,
  );
  const [miteAfter, setMiteAfter] = useState<number | null>(
    action?.miteCountAfter ?? null,
  );
  const [sampleSize, setSampleSize] = useState<number | null>(
    action?.miteSampleSize ?? null,
  );

  const selectedProduct = products?.find((p) => p.id === selectedId);
  const isOther = selectedId === OTHER;
  const displayUnit = getTreatmentDisplayUnit(unit, unitPreference);

  const handleProductChange = (value: string) => {
    setSelectedId(value);
    if (value === OTHER) return;
    const product = products?.find((p) => p.id === value);
    if (product?.defaultUnit) setUnit(product.defaultUnit);
    setCustomProductName('');
  };

  const handleSave = () => {
    const productName = isOther
      ? customProductName
      : (selectedProduct?.name ?? '');

    let apiAmount = amount;
    if (amount !== null) {
      if (unit === 'ml' && unitPreference === 'imperial') {
        apiAmount = parseVolume(amount, 'fl oz', unitPreference) * 1000;
      } else if (unit === 'g' && unitPreference === 'imperial') {
        apiAmount = parseMass(amount, 'oz', unitPreference);
      }
    }

    onSave({
      type: 'TREATMENT',
      treatmentType: productName,
      productId: isOther ? null : selectedId,
      amount: apiAmount,
      unit,
      notes: notes.trim() || undefined,
      miteCountMethod: showEfficacy && miteMethod ? miteMethod : null,
      miteCountBefore: showEfficacy ? miteBefore : null,
      miteCountAfter: showEfficacy ? miteAfter : null,
      miteSampleSize: showEfficacy ? sampleSize : null,
    });
  };

  const isValid =
    (isOther ? customProductName.trim() : selectedId) &&
    amount !== null &&
    amount > 0;

  return (
    <div
      className={'grid grid-cols-2 gap-4 mt-5'}
      data-test={TEST_SELECTORS.TREATMENT_FORM}
    >
      <h3 className="col-span-2 text-lg font-bold">
        {t('inspection:form.actions.treatment_section.title')}
      </h3>

      {/* Product Selector (catalog: built-ins + custom) */}
      <div className={'col-span-2 lg:col-span-1 flex flex-col gap-4'}>
        <label htmlFor={'treatment-type'}>
          {t('inspection:form.actions.treatment_section.treatmentType')}
        </label>
        <Select value={selectedId} onValueChange={handleProductChange}>
          <SelectTrigger className={'w-full'} data-test="treatment-product-select">
            <SelectValue
              id={'treatment-type'}
              placeholder={t(
                'inspection:form.actions.treatment_section.selectTreatmentType',
              )}
            />
          </SelectTrigger>
          <SelectContent>
            {products?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
            <SelectItem value={OTHER}>
              {t('inspection:form.actions.treatment_section.other', {
                defaultValue: 'Other (free text)',
              })}
            </SelectItem>
          </SelectContent>
        </Select>
        <Link
          to="/treatment-products"
          className="text-xs text-muted-foreground underline"
        >
          {t('inspection:form.actions.treatment_section.manageProducts', {
            defaultValue: 'Manage products',
          })}
        </Link>
      </div>

      {/* Custom Product Name (OTHER) */}
      {isOther && (
        <div className={'col-span-2 lg:col-span-1 flex flex-col gap-4'}>
          <label htmlFor={'custom-product'}>
            {t('inspection:form.actions.treatment_section.productName')}
          </label>
          <Input
            id={'custom-product'}
            placeholder={t(
              'inspection:form.actions.treatment_section.productNamePlaceholder',
            )}
            value={customProductName}
            onChange={(e) => setCustomProductName(e.target.value)}
          />
        </div>
      )}

      {/* Unit Selector */}
      <div className={`col-span-2 lg:col-span-1 flex flex-col gap-4`}>
        <label htmlFor={'unit'}>
          {t('inspection:form.actions.treatment_section.unit')}
        </label>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className={'w-full'}>
            <SelectValue
              id={'unit'}
              placeholder={t(
                'inspection:form.actions.treatment_section.selectUnit',
              )}
            >
              {displayUnit}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TREATMENT_UNITS.map((u) => (
              <SelectItem key={u} value={u}>
                {getTreatmentDisplayUnit(u, unitPreference)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className={'col-span-2 lg:col-span-1 flex flex-col gap-4'}>
        <label htmlFor={'amount'}>
          {t('inspection:form.actions.treatment_section.amount')}
        </label>
        <NumericInputField
          id={'amount'}
          step={unit === 'pcs' ? 1 : 5}
          min={0}
          value={amount}
          onChange={(e) => setAmount(e)}
          unit={displayUnit}
        />
      </div>

      {/* Efficacy (optional) */}
      <div className="col-span-2">
        {!showEfficacy ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => setShowEfficacy(true)}
          >
            {t('inspection:form.actions.treatment_section.addEfficacy', {
              defaultValue: '+ Add mite counts (efficacy)',
            })}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 rounded border p-3">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm">
                {t('inspection:form.actions.treatment_section.miteMethod', {
                  defaultValue: 'Mite count method',
                })}
              </label>
              <Select value={miteMethod} onValueChange={setMiteMethod}>
                <SelectTrigger data-test="mite-method">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {MITE_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm">
                {t('inspection:form.actions.treatment_section.miteBefore', {
                  defaultValue: 'Mites before',
                })}
              </label>
              <NumericInputField
                min={0}
                value={miteBefore}
                onChange={(e) => setMiteBefore(e)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm">
                {t('inspection:form.actions.treatment_section.miteAfter', {
                  defaultValue: 'Mites after',
                })}
              </label>
              <NumericInputField
                min={0}
                value={miteAfter}
                onChange={(e) => setMiteAfter(e)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm">
                {t('inspection:form.actions.treatment_section.sampleSize', {
                  defaultValue: 'Sample size (bees)',
                })}
              </label>
              <NumericInputField
                min={0}
                value={sampleSize}
                onChange={(e) => setSampleSize(e)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="col-span-2 flex flex-col gap-4">
        <label htmlFor="notes">
          {t('inspection:form.actions.treatment_section.notesOptional')}
        </label>
        <Textarea
          id="notes"
          placeholder={t(
            'inspection:form.actions.treatment_section.notesPlaceholder',
          )}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          data-test={TEST_SELECTORS.TREATMENT_NOTES}
        />
      </div>

      <div className="col-span-2 flex justify-end">
        {isValid && (
          <Button onClick={handleSave} data-test="treatment-save">
            {t('inspection:form.actions.save')}
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
  const { t } = useTranslation('inspection');
  const [isEditing, setIsEditing] = useState(false);
  const { unitPreference } = useUnitFormat();

  if (!action) {
    return null;
  }

  const treatmentLabel = action.treatmentType;

  const getDisplayValue = () => {
    if (action.amount === null || action.amount === undefined) {
      return null;
    }
    return formatTreatmentQuantity(action.amount, action.unit, unitPreference)
      .label;
  };

  const displayValue = getDisplayValue();
  const efficacy =
    action.miteCountBefore != null &&
    action.miteCountAfter != null &&
    action.miteCountBefore > 0
      ? Math.round(
          ((action.miteCountBefore - action.miteCountAfter) /
            action.miteCountBefore) *
            100,
        )
      : null;

  const handleSave = (updatedAction: TreatmentActionType) => {
    onSave(updatedAction);
    setIsEditing(false);
  };

  return isEditing ? (
    <TreatmentForm action={action} onSave={handleSave} onRemove={onRemove} />
  ) : (
    <ActionViewRenderer
      title={t('inspection:form.actions.treatment_section.title')}
      badges={
        <>
          <Badge>{treatmentLabel}</Badge>
          {displayValue && <span>{displayValue}</span>}
          {efficacy != null && (
            <Badge variant="secondary" data-test="treatment-efficacy">
              {t('inspection:form.actions.treatment_section.efficacy', {
                defaultValue: '{{p}}% efficacy',
                p: efficacy,
              })}
            </Badge>
          )}
        </>
      }
      notes={action.notes}
      onEdit={() => setIsEditing(true)}
      onRemove={() => onRemove('TREATMENT')}
      data-test={TEST_SELECTORS.TREATMENT_VIEW}
    />
  );
};
