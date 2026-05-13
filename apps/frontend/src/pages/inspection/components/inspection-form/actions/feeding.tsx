import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Pill } from '@/components/common';
import NumericInputField from '@/components/common/numeric-input-field.tsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useUnitFormat } from '@/hooks/use-unit-format';
import { parseVolume } from '@/utils/unit-conversion';
import { ActionViewRenderer } from './action-view-container';

export type FeedType = 'SYRUP' | 'HONEY' | 'CANDY' | 'PROTEIN_CANDY' | 'POLLEN_PATTY' | 'OTHER';

export type FeedingActionType = {
  type: 'FEEDING';
  feedType: string;
  quantity: number;
  unit: string;
  concentration?: string;
  notes?: string;
};

export const FEED_TYPES: { id: FeedType; fallbackLabel: string }[] = [
  { id: 'SYRUP', fallbackLabel: 'Syrup' },
  { id: 'HONEY', fallbackLabel: 'Honey' },
  { id: 'CANDY', fallbackLabel: 'Candy' },
  { id: 'PROTEIN_CANDY', fallbackLabel: 'Protein Candy' },
  { id: 'POLLEN_PATTY', fallbackLabel: 'Pollen Patty' },
  { id: 'OTHER', fallbackLabel: 'Other' },
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
  const { t } = useTranslation('inspection');
  const { unitPreference } = useUnitFormat();

  const feedTypeI18nKeys: Record<FeedType, string> = {
    SYRUP: t('inspection:form.actions.feeding_section.syrup'),
    HONEY: t('inspection:form.actions.feeding_section.honey'),
    CANDY: t('inspection:form.actions.feeding_section.candy'),
    PROTEIN_CANDY: t('inspection:form.actions.feeding_section.proteinCandy'),
    POLLEN_PATTY: t('inspection:form.actions.feeding_section.pollenPatty'),
    OTHER: t('inspection:form.actions.feeding_section.other'),
  };

  // If the stored feedType is not in the known list, treat it as OTHER with custom name
  const knownFeedTypes = new Set<string>(FEED_TYPES.map(f => f.id));
  const isKnownType = knownFeedTypes.has(action?.feedType ?? 'SYRUP');

  const [quantity, setQuantity] = useState<number | null>(
    action?.quantity ?? 100,
  );
  const [concentration, setConcentration] = useState<string>(
    action?.concentration ?? '1:1',
  );
  const [feedType, setFeedType] = useState<FeedType | null>(
    isKnownType ? (action?.feedType as FeedType ?? 'SYRUP') : 'OTHER',
  );
  const [customFeedName, setCustomFeedName] = useState<string>(
    isKnownType ? '' : (action?.feedType ?? ''),
  );
  const [notes, setNotes] = useState<string>(action?.notes ?? '');

  const showConcentration = feedType === 'SYRUP';

  // Get display units based on user preference and feed type
  // Using fixed units to avoid confusion when values change
  const units =
    feedType === 'SYRUP'
      ? unitPreference === 'imperial'
        ? 'fl oz'
        : 'ml'
      : unitPreference === 'imperial'
        ? 'oz'
        : 'g';
  return (
    <div
      className={'grid grid-cols-1 md:grid-cols-2 gap-4 mt-5'}
      data-test={TEST_SELECTORS.FEEDING_FORM}
    >
      <h3 className="md:col-span-2 col-span-1 text-lg font-bold">{t('inspection:form.actions.feeding_section.title')}</h3>
      <div className="lg:col-span-2 flex flex-col gap-4">
        <label>{t('inspection:form.actions.feeding_section.feedType')}</label>
        <div className="flex flex-wrap gap-4">
          {FEED_TYPES.map(({ id, fallbackLabel }) => (
            <Pill
              key={id}
              color={'blue'}
              active={feedType === id}
              onClick={e => {
                e.preventDefault();
                if (feedType === id) {
                  setFeedType(null);
                } else {
                  setFeedType(id);
                  if (id !== 'OTHER') {
                    setCustomFeedName('');
                  }
                }
              }}
            >
              {feedTypeI18nKeys[id] || fallbackLabel}
            </Pill>
          ))}
        </div>
      </div>
      {feedType === 'OTHER' && (
        <div className="lg:col-span-2 flex flex-col gap-4">
          <label htmlFor="customFeedName">{t('inspection:form.actions.feeding_section.customFeedName')}</label>
          <Input
            id="customFeedName"
            placeholder={t('inspection:form.actions.feeding_section.customFeedNamePlaceholder')}
            value={customFeedName}
            onChange={e => setCustomFeedName(e.target.value)}
          />
        </div>
      )}
      {feedType && (
        <div className={'flex flex-col gap-4'}>
          <label htmlFor={'quantity'}>{t('inspection:form.actions.feeding_section.quantity')}</label>
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
            <label htmlFor={'concentration'}>{t('inspection:form.actions.feeding_section.concentration')}</label>
            <Select
              value={concentration}
              onValueChange={val => setConcentration(val)}
            >
              <SelectTrigger className={'w-full'}>
                <SelectValue
                  id={'concentration'}
                  placeholder={t('inspection:form.actions.feeding_section.selectConcentration')}
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

      <div className="lg:col-span-2 flex flex-col gap-4">
        <label htmlFor="notes">{t('inspection:form.actions.feeding_section.notesOptional')}</label>
        <Textarea
          id="notes"
          placeholder={t('inspection:form.actions.feeding_section.notesPlaceholder')}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          data-test={TEST_SELECTORS.FEEDING_NOTES}
        />
      </div>

      <div className="lg:col-span-2 flex justify-end">
        {feedType && quantity && (feedType !== 'OTHER' || customFeedName.trim()) && (
          <Button onClick={handleSave}>
            {t('inspection:form.actions.save')}
          </Button>
        )}
      </div>
    </div>
  );

  function handleSave() {
    if (!feedType || !quantity) return;

    let apiQuantity = quantity;
    let apiUnit: string;

    if (feedType === 'SYRUP') {
      apiUnit = 'ml';
      if (unitPreference === 'imperial') {
        // fl oz → ml
        apiQuantity = parseVolume(quantity, 'fl oz', unitPreference) * 1000;
      }
    } else {
      apiUnit = 'g';
      if (unitPreference === 'imperial') {
        // oz → grams
        apiQuantity = quantity * 28.3495;
      }
    }

    onSave({
      type: 'FEEDING',
      feedType: feedType === 'OTHER' ? customFeedName.trim() : feedType,
      quantity: apiQuantity,
      concentration: feedType === 'SYRUP' ? concentration : undefined,
      unit: apiUnit,
      notes: notes.trim() || undefined,
    });
  }
};

// Maps a feedType string to its English display label.
// For unknown feed types (custom OTHER values), returns the raw feedType string.
const FEED_TYPE_LABELS = Object.fromEntries(
  FEED_TYPES.map(({ id, fallbackLabel }) => [id, fallbackLabel]),
) as Record<string, string>;

export const getFeedTypeLabel = (feedType: string): string =>
  FEED_TYPE_LABELS[feedType] ?? feedType;

export const FeedingView: React.FC<FeedingActionProps> = ({
  action,
  onSave,
  onRemove,
}) => {
  const { t } = useTranslation('inspection');
  const [isEditing, setIsEditing] = useState(false);
  const { formatVolume, formatWeight } = useUnitFormat();

  if (!action) {
    return null;
  }

  // Convert stored metric values to user's preferred units for display
  const getDisplayValue = () => {
    if (action.feedType === 'SYRUP') {
      // Convert ml to user's preferred volume unit
      const volumeInLiters = action.quantity / 1000;
      return formatVolume(volumeInLiters).label;
    } else {
      // Convert grams to user's preferred weight unit
      const weightInKg = action.quantity / 1000;
      return formatWeight(weightInKg).label;
    }
  };

  const handleSave = (updatedAction: FeedingActionType) => {
    onSave(updatedAction);
    setIsEditing(false);
  };

  return isEditing ? (
    <FeedingForm
      action={action}
      onSave={handleSave}
      onRemove={onRemove}
    />
  ) : (
    <ActionViewRenderer
      title={t('inspection:form.actions.feeding_section.title')}
      badges={
        <>
          <Badge>{getFeedTypeLabel(action.feedType)}</Badge>
          <span>{getDisplayValue()}</span>
          {action.feedType === 'SYRUP' && action.concentration && (
            <span>{action.concentration}</span>
          )}
        </>
      }
      notes={action.notes}
      onEdit={() => setIsEditing(true)}
      onRemove={() => onRemove('FEEDING')}
      data-test={TEST_SELECTORS.FEEDING_VIEW}
    />
  );
};
