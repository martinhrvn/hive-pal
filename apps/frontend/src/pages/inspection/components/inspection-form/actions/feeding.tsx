import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import NumericInputField from '@/components/common/numeric-input-field.tsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  BUILTIN_FEED_TYPES,
  FEED_ENTRY_UNITS,
  FeedEntryUnit,
  feedAmountToGrams,
  feedSugarGrams,
  getBuiltinFeedType,
  isVolumeFeedUnit,
  legacyFeedToBuiltinId,
  UserFeedTypeResponse,
} from 'shared-schemas';
import { useFeedTypes } from '@/api/hooks';
import {
  getPreferredFeedUnit,
  saveFeedUnitPreference,
} from '@/utils/feeding-unit-preference';
import { ActionViewRenderer } from './action-view-container';

export type FeedingActionType = {
  type: 'FEEDING';
  feedType: string;
  quantity: number;
  unit: string;
  concentration?: string;
  notes?: string;
  // v2 fields — see shared-schemas actions/feeding.ts
  feedTypeId?: string;
  enteredAmount?: number;
  enteredUnit?: FeedEntryUnit;
  amountG?: number;
  density?: number;
  sugarContent?: number;
  sugarG?: number;
  waterAddedMl?: number;
};

/** Sentinel id for a one-off free-text feed type. */
const FREETEXT = '__CUSTOM__';

/** Concentration label kept on legacy field for old consumers of the API. */
const BUILTIN_CONCENTRATION: Record<string, string> = {
  SYRUP_1_1: '1:1',
  SYRUP_3_2: '3:2',
  SYRUP_2_1: '2:1',
};

type FeedSpec = {
  label: string;
  density: number | null;
  sugarContent: number | null;
};

const resolveSpec = (
  selectedId: string | null,
  userFeedTypes: UserFeedTypeResponse[],
): FeedSpec | null => {
  if (!selectedId || selectedId === FREETEXT) return null;
  const builtin = getBuiltinFeedType(selectedId);
  if (builtin) {
    return {
      label: builtin.label,
      density: builtin.density,
      sugarContent: builtin.sugarContent,
    };
  }
  const custom = userFeedTypes.find(f => f.id === selectedId);
  if (custom) {
    return {
      label: custom.label,
      density: custom.density,
      sugarContent: custom.sugarContent,
    };
  }
  return null;
};

/** Sensible default entry unit for a feed: volume for liquids, mass for solids. */
const defaultUnitFor = (spec: FeedSpec | null): FeedEntryUnit =>
  spec?.density != null ? 'l' : 'kg';

/**
 * The unit to preselect for a feed: the remembered last-used unit (per type,
 * then global) when it is valid for this feed, otherwise the feed's default.
 */
const preferredUnitFor = (
  selectedId: string | null,
  spec: FeedSpec | null,
): FeedEntryUnit => {
  const preferred = getPreferredFeedUnit(
    selectedId === FREETEXT ? null : selectedId,
  );
  if (preferred && (!isVolumeFeedUnit(preferred) || spec?.density != null)) {
    return preferred;
  }
  return defaultUnitFor(spec);
};

const normalizeLegacyUnit = (unit: string): FeedEntryUnit => {
  switch (unit.toLowerCase()) {
    case 'ml':
      return 'ml';
    case 'l':
      return 'l';
    case 'kg':
      return 'kg';
    default:
      return 'g';
  }
};

const formatGrams = (grams: number): string =>
  grams >= 1000
    ? `${(Math.round(grams / 10) / 100).toLocaleString()} kg`
    : `${Math.round(grams)} g`;

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
  const { data: userFeedTypes = [] } = useFeedTypes();

  // Resolve the initial selection: v2 id → legacy builtin mapping → free text.
  const initialId = (() => {
    if (!action) return null;
    if (action.feedTypeId) return action.feedTypeId;
    const legacy = legacyFeedToBuiltinId(action.feedType, action.concentration);
    return legacy ?? FREETEXT;
  })();

  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [customFeedName, setCustomFeedName] = useState<string>(
    initialId === FREETEXT ? (action?.feedType ?? '') : '',
  );
  const [enteredAmount, setEnteredAmount] = useState<number | null>(
    action?.enteredAmount ?? action?.quantity ?? null,
  );
  const [enteredUnit, setEnteredUnit] = useState<FeedEntryUnit>(
    action?.enteredUnit ??
      (action
        ? normalizeLegacyUnit(action.unit)
        : preferredUnitFor(initialId, resolveSpec(initialId, userFeedTypes))),
  );
  const [waterAddedMl, setWaterAddedMl] = useState<number | null>(
    action?.waterAddedMl ?? null,
  );
  const [notes, setNotes] = useState<string>(action?.notes ?? '');

  const spec = resolveSpec(selectedId, userFeedTypes);

  // Volume entry needs a density; free-text/solid feeds are weight-only.
  const availableUnits = FEED_ENTRY_UNITS.filter(
    unit => !isVolumeFeedUnit(unit) || spec?.density != null,
  );

  const amountG =
    enteredAmount != null && enteredAmount > 0
      ? feedAmountToGrams(enteredAmount, enteredUnit, spec?.density)
      : null;
  const sugarG =
    amountG != null && spec?.sugarContent != null
      ? feedSugarGrams(amountG, spec.sugarContent)
      : null;
  // The conversion hint only adds information for volume entries.
  const showConversion = amountG != null && isVolumeFeedUnit(enteredUnit);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (id !== FREETEXT) setCustomFeedName('');
    const nextSpec = resolveSpec(id, userFeedTypes);
    // The unit field only appears after a type is picked, so selecting a type
    // owns the unit: last-used for this feed (validated), else the feed's
    // default (L for liquids, kg for solids).
    setEnteredUnit(preferredUnitFor(id, nextSpec));
  };

  const builtinLabel = (id: string, fallback: string) =>
    t(`inspection:form.actions.feeding_section.types.${id}`, {
      defaultValue: fallback,
    });

  const canSave =
    enteredAmount != null &&
    enteredAmount > 0 &&
    (selectedId === FREETEXT ? customFeedName.trim().length > 0 : !!spec);

  return (
    <div
      className={'grid grid-cols-1 md:grid-cols-2 gap-4 mt-5'}
      data-test={TEST_SELECTORS.FEEDING_FORM}
    >
      <h3 className="md:col-span-2 col-span-1 text-lg font-bold">
        {t('inspection:form.actions.feeding_section.title')}
      </h3>

      <div className="lg:col-span-2 flex flex-col gap-4">
        <label htmlFor="feedType">
          {t('inspection:form.actions.feeding_section.feedType')}
        </label>
        <Select value={selectedId ?? undefined} onValueChange={handleSelect}>
          <SelectTrigger className="w-full" id="feedType">
            <SelectValue
              placeholder={t(
                'inspection:form.actions.feeding_section.selectFeedType',
                { defaultValue: 'Select feed type' },
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>
                {t('inspection:form.actions.feeding_section.builtinTypes', {
                  defaultValue: 'Standard',
                })}
              </SelectLabel>
              {BUILTIN_FEED_TYPES.map(feed => (
                <SelectItem key={feed.id} value={feed.id}>
                  {builtinLabel(feed.id, feed.label)}
                </SelectItem>
              ))}
            </SelectGroup>
            {userFeedTypes.filter(f => !f.archived).length > 0 && (
              <SelectGroup>
                <SelectLabel>
                  {t('inspection:form.actions.feeding_section.myTypes', {
                    defaultValue: 'My feed types',
                  })}
                </SelectLabel>
                {userFeedTypes
                  .filter(f => !f.archived)
                  .map(feed => (
                    <SelectItem key={feed.id} value={feed.id}>
                      {feed.label}
                    </SelectItem>
                  ))}
              </SelectGroup>
            )}
            <SelectGroup>
              <SelectLabel>
                {t('inspection:form.actions.feeding_section.otherGroup', {
                  defaultValue: 'Other',
                })}
              </SelectLabel>
              <SelectItem value={FREETEXT}>
                {t('inspection:form.actions.feeding_section.customOneOff', {
                  defaultValue: 'Custom (one-off)…',
                })}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t('inspection:form.actions.feeding_section.manageTypesHint', {
            defaultValue:
              'Add your own feeds (with density and sugar content) under Settings → Feed types.',
          })}
        </p>
      </div>

      {selectedId === FREETEXT && (
        <div className="lg:col-span-2 flex flex-col gap-4">
          <label htmlFor="customFeedName">
            {t('inspection:form.actions.feeding_section.customFeedName')}
          </label>
          <Input
            id="customFeedName"
            placeholder={t(
              'inspection:form.actions.feeding_section.customFeedNamePlaceholder',
            )}
            value={customFeedName}
            onChange={e => setCustomFeedName(e.target.value)}
          />
        </div>
      )}

      {selectedId && (
        <div className={'flex flex-col gap-4'}>
          <label htmlFor={'quantity'}>
            {t('inspection:form.actions.feeding_section.quantity')}
          </label>
          <div className="flex gap-2">
            <NumericInputField
              id={'quantity'}
              step={enteredUnit === 'kg' || enteredUnit === 'l' ? 0.5 : 100}
              min={0}
              value={enteredAmount}
              onChange={e => setEnteredAmount(e)}
            />
            <Select
              value={enteredUnit}
              onValueChange={value => setEnteredUnit(value as FeedEntryUnit)}
            >
              <SelectTrigger className="w-24" aria-label={t('inspection:form.actions.feeding_section.unit', { defaultValue: 'Unit' })}>
                <SelectValue>{enteredUnit === 'l' ? 'L' : enteredUnit}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>
                    {unit === 'l' ? 'L' : unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showConversion && amountG != null && (
            <p className="text-xs text-muted-foreground">
              ≈ {formatGrams(amountG)}
            </p>
          )}
        </div>
      )}

      {selectedId && (
        <div className={'flex flex-col gap-4'}>
          <label htmlFor={'waterAddedMl'}>
            {t('inspection:form.actions.feeding_section.waterAdded', {
              defaultValue: 'Diluted with water (ml, optional)',
            })}
          </label>
          <NumericInputField
            id={'waterAddedMl'}
            step={100}
            min={0}
            value={waterAddedMl}
            onChange={e => setWaterAddedMl(e)}
            unit="ml"
          />
        </div>
      )}

      {sugarG != null && (
        <div className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">
            {t('inspection:form.actions.feeding_section.sugarReadout', {
              defaultValue: '≈ {{amount}} of sugar',
              amount: formatGrams(sugarG),
            })}
          </p>
        </div>
      )}

      <div className="lg:col-span-2 flex flex-col gap-4">
        <label htmlFor="notes">
          {t('inspection:form.actions.feeding_section.notesOptional')}
        </label>
        <Textarea
          id="notes"
          placeholder={t(
            'inspection:form.actions.feeding_section.notesPlaceholder',
          )}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          data-test={TEST_SELECTORS.FEEDING_NOTES}
        />
      </div>

      <div className="lg:col-span-2 flex justify-end">
        {canSave && (
          <Button onClick={handleSave}>
            {t('inspection:form.actions.save')}
          </Button>
        )}
      </div>
    </div>
  );

  function handleSave() {
    if (enteredAmount == null || enteredAmount <= 0 || !selectedId) return;

    const isFreetext = selectedId === FREETEXT;
    const label = isFreetext ? customFeedName.trim() : (spec?.label ?? '');
    if (!label) return;

    // Remember the unit actually used, so the next feeding preselects it.
    saveFeedUnitPreference(isFreetext ? null : selectedId, enteredUnit);

    onSave({
      type: 'FEEDING',
      // Legacy fields, kept for old consumers: human-readable type, the
      // entered amount/unit verbatim, and the classic ratio for builtin syrups.
      feedType: label,
      quantity: enteredAmount,
      unit: enteredUnit,
      concentration: BUILTIN_CONCENTRATION[selectedId] ?? undefined,
      // v2 fields (server recomputes amountG/sugarG authoritatively).
      feedTypeId: isFreetext ? undefined : selectedId,
      enteredAmount,
      enteredUnit,
      amountG: amountG ?? undefined,
      density: spec?.density ?? undefined,
      sugarContent: spec?.sugarContent ?? undefined,
      sugarG: sugarG ?? undefined,
      waterAddedMl: waterAddedMl && waterAddedMl > 0 ? waterAddedMl : undefined,
      notes: notes.trim() || undefined,
    });
  }
};

// Maps a stored feedType to a display label. New records store the label
// itself; legacy records store ids like SYRUP/POLLEN_PATTY.
const LEGACY_FEED_TYPE_LABELS: Record<string, string> = {
  SYRUP: 'Syrup',
  HONEY: 'Honey',
  CANDY: 'Candy',
  PROTEIN_CANDY: 'Protein Candy',
  POLLEN_PATTY: 'Pollen Patty',
  OTHER: 'Other',
};

export const getFeedTypeLabel = (feedType: string): string =>
  LEGACY_FEED_TYPE_LABELS[feedType] ?? feedType;

export const FeedingView: React.FC<FeedingActionProps> = ({
  action,
  onSave,
  onRemove,
}) => {
  const { t } = useTranslation('inspection');
  const [isEditing, setIsEditing] = useState(false);

  if (!action) {
    return null;
  }

  // v2 records display exactly what was entered; legacy records fall back to
  // the old ml-for-syrup / grams-otherwise convention.
  const displayAmount = () => {
    if (action.enteredAmount != null && action.enteredUnit) {
      return `${action.enteredAmount.toLocaleString()} ${
        action.enteredUnit === 'l' ? 'L' : action.enteredUnit
      }`;
    }
    const legacyUnit = action.feedType === 'SYRUP' ? 'ml' : 'g';
    return `${action.quantity.toLocaleString()} ${action.unit || legacyUnit}`;
  };

  const handleSave = (updatedAction: FeedingActionType) => {
    onSave(updatedAction);
    setIsEditing(false);
  };

  return isEditing ? (
    <FeedingForm action={action} onSave={handleSave} onRemove={onRemove} />
  ) : (
    <ActionViewRenderer
      title={t('inspection:form.actions.feeding_section.title')}
      badges={
        <>
          <Badge>{getFeedTypeLabel(action.feedType)}</Badge>
          <span>{displayAmount()}</span>
          {action.sugarG != null && (
            <span className="text-muted-foreground">
              {t('inspection:form.actions.feeding_section.sugarShort', {
                defaultValue: '≈ {{amount}} sugar',
                amount: formatGrams(action.sugarG),
              })}
            </span>
          )}
          {action.waterAddedMl != null && action.waterAddedMl > 0 && (
            <span className="text-muted-foreground">
              {t('inspection:form.actions.feeding_section.waterShort', {
                defaultValue: '+ {{amount}} ml water',
                amount: action.waterAddedMl.toLocaleString(),
              })}
            </span>
          )}
          {!action.sugarG &&
            action.feedType === 'SYRUP' &&
            action.concentration && <span>{action.concentration}</span>}
        </>
      }
      notes={action.notes}
      onEdit={() => setIsEditing(true)}
      onRemove={() => onRemove('FEEDING')}
      data-test={TEST_SELECTORS.FEEDING_VIEW}
    />
  );
};
