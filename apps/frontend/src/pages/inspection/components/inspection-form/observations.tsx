import React from 'react';
import { FieldPath, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Input } from '@/components/ui/input';
import { InspectionFormData } from './schema';

// ─── Counter Card ─────────────────────────────────────────────────────────────
// Replaces the old 0–10 rating bar with a large-button +/– card that works
// comfortably with gloves on.

type ObservationCounterProps<T> = {
  name: T;
  label: string;
  description?: string;
  max?: number; // undefined = unbounded
};

const ObservationCounter = <TName extends FieldPath<InspectionFormData>>({
  name,
  label,
  description,
  max,
}: ObservationCounterProps<TName>) => {
  const { control } = useFormContext<InspectionFormData>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue = field.value as number | null | undefined;

        const decrement = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          field.onChange(Math.max(0, (currentValue ?? 0) - 1));
        };

        const increment = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          const next = (currentValue ?? 0) + 1;
          field.onChange(max === undefined ? next : Math.min(max, next));
        };

        const clear = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          field.onChange(undefined);
        };

        return (
          <FormItem>
            <div className="flex flex-col gap-1.5 p-3 rounded-xl border bg-card">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                {currentValue != null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={clear}
                    aria-label="Clear"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Optional description */}
              {description && (
                <p className="text-xs text-muted-foreground leading-snug">{description}</p>
              )}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-xl shrink-0 text-lg"
                  onClick={decrement}
                  disabled={currentValue == null || currentValue <= 0}
                  aria-label={`Decrease ${label}`}
                >
                  <Minus className="h-6 w-6" />
                </Button>

                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-3xl font-bold tabular-nums leading-none">
                    {currentValue ?? '—'}
                  </span>
                  {max !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {currentValue == null ? `of ${max}` : `/ ${max}`}
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-xl shrink-0 text-lg"
                  onClick={increment}
                  disabled={max !== undefined && currentValue === max}
                  aria-label={`Increase ${label}`}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

// ─── Subjective Score Field ───────────────────────────────────────────────────
// A simple 0–10 numeric input used in subjective inspection mode.

type SubjectiveScoreFieldProps = {
  name: FieldPath<InspectionFormData>;
  label: string;
};

const SubjectiveScoreField: React.FC<SubjectiveScoreFieldProps> = ({ name, label }) => {
  const { control } = useFormContext<InspectionFormData>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border bg-card">
            <FormLabel className="text-sm font-medium">{label} (0–10)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                max={10}
                step={1}
                value={field.value ?? ''}
                onChange={e => {
                  const val = e.target.value;
                  field.onChange(val === '' ? undefined : Number(val));
                }}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// ─── Checkbox Observation Field ───────────────────────────────────────────────

type CheckboxObservationFieldProps = {
  name: FieldPath<InspectionFormData>;
  label: string;
  description?: string;
};

const CheckboxObservationField: React.FC<CheckboxObservationFieldProps> = ({
  name,
  label,
  description,
}) => {
  const { control } = useFormContext<InspectionFormData>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 shadow">
          <FormControl>
            <Checkbox
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
              className="h-6 w-6 mt-0.5"
            />
          </FormControl>
          <div className="space-y-1">
            <FormLabel className="text-base">{label}</FormLabel>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// ─── Toggle Chip Group ────────────────────────────────────────────────────────

type ToggleChipGroupProps = {
  name: FieldPath<InspectionFormData>;
  options: string[];
  selectedColor: 'blue' | 'amber';
  columns: 'cols-2' | 'cols-3' | 'cols-1';
  getLabel: (option: string) => string;
};

const ToggleChipGroup: React.FC<ToggleChipGroupProps> = ({
  name,
  options,
  selectedColor,
  columns,
  getLabel,
}) => {
  const { control } = useFormContext<InspectionFormData>();

  const colorMap = {
    blue: {
      selected: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
      unselected: 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
    },
    amber: {
      selected: 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300',
      unselected: 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
    },
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValues: string[] = field.value || [];

        const toggle = (value: string) => {
          const updated = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
          field.onChange(updated);
        };

        return (
          <FormItem>
            <div className={`grid grid-cols-1 sm:${columns} gap-2`}>
              {options.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`cursor-pointer py-3 px-2 rounded-xl border text-center text-sm font-medium transition-colors ${
                    currentValues.includes(option)
                      ? colorMap[selectedColor].selected
                      : colorMap[selectedColor].unselected
                  }`}
                  onClick={() => toggle(option)}
                >
                  {getLabel(option)}
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

// ─── Observations Section ─────────────────────────────────────────────────────

type ObservationsSectionProps = {
  /** Number of frames across all brood boxes */
  broodFrames?: number | null;
  /** Number of brood boxes */
  broodBoxCount?: number | null;
  /** Whether the apiary uses subjective (0–10) inspection mode */
  isSubjective?: boolean;
};

export const ObservationsSection: React.FC<ObservationsSectionProps> = ({
  broodFrames,
  broodBoxCount,
  isSubjective = false,
}) => {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();
  const queenCells = useWatch({ name: 'observations.queenCells', control });

  // Strength max = total brood frames + number of brood boxes (the spaces between frames)
  let strengthMax: number | undefined;
  if (broodFrames == null) {
    strengthMax = undefined;
  } else if (broodBoxCount == null) {
    strengthMax = broodFrames;
  } else {
    strengthMax = broodFrames + broodBoxCount;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t('observations.title')}</h3>
      </div>

      {/* Queen seen checkbox */}
      <FormField
        control={control}
        name="observations.queenSeen"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-4 shadow">
            <FormControl>
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                className="h-6 w-6"
              />
            </FormControl>
            <FormLabel className="text-base">{t('observations.queenSeen')}</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Main counter cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isSubjective ? (
          <SubjectiveScoreField
            name="observations.strength"
            label={t('observations.strength')}
          />
        ) : (
          <ObservationCounter
            name="observations.strength"
            label={t('observations.strength')}
            description="Count the number of spaces between the frames that you can see are full of bees"
            max={strengthMax}
          />
        )}
        <ObservationCounter
          name="observations.queenCells"
          label={t('observations.queenCells')}
          /* unbounded */
        />
      </div>

      {/* Subjective 0–10 brood and stores fields */}
      {isSubjective && (
        <div className="grid grid-cols-2 gap-3">
          <SubjectiveScoreField name="observations.cappedBrood" label="Capped Brood" />
          <SubjectiveScoreField name="observations.uncappedBrood" label="Uncapped Brood" />
          <SubjectiveScoreField name="observations.honeyStores" label="Honey Stores" />
          <SubjectiveScoreField name="observations.pollenStores" label="Pollen Stores" />
        </div>
      )}

      {/* Swarm / supersedure cells — shown only when queen cells > 0 */}
      {(queenCells ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CheckboxObservationField
            name="observations.swarmCells"
            label={t('observations.swarmCells')}
            description={t('observations.swarmCellsDescription')}
          />
          <CheckboxObservationField
            name="observations.supersedureCells"
            label={t('observations.supersedureCells')}
            description={t('observations.supersedureCellsDescription')}
          />
        </div>
      )}

      {/* Brood Pattern */}
      <div>
        <FormField
          control={control}
          name="observations.broodPattern"
          render={({ field }) => {
            const currentValue = field.value;
            const broodPatternOptions = [
              'solid',
              'spotty',
              'scattered',
              'patchy',
              'excellent',
              'poor',
            ];

            return (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  {t('observations.broodPattern')}
                </FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {broodPatternOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      className={`cursor-pointer py-3 px-2 rounded-xl border text-center text-sm font-medium transition-colors ${
                        currentValue === option
                          ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                      }`}
                      onClick={() =>
                        field.onChange(currentValue === option ? null : option)
                      }
                    >
                      {t(`observations.broodPatternOptions.${option}`)}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      {/* Additional Observations */}
      <div>
        <h4 className="text-base font-medium mb-3">
          {t('observations.additionalObservations')}
        </h4>
        <ToggleChipGroup
          name="observations.additionalObservations"
          options={[
            'calm',
            'defensive',
            'aggressive',
            'nervous',
            'varroa_present',
            'small_hive_beetle',
            'wax_moths',
            'ants_present',
            'healthy',
            'active',
            'sluggish',
            'thriving',
          ]}
          selectedColor="blue"
          columns="cols-3"
          getLabel={option => t(`observations.additional.${option}`)}
        />
      </div>

      {/* Reminder Observations */}
      <div>
        <h4 className="text-base font-medium mb-3">
          {t('observations.reminderObservations')}
        </h4>
        <ToggleChipGroup
          name="observations.reminderObservations"
          options={[
            'honey_bound',
            'overcrowded',
            'needs_super',
            'queen_issues',
            'requires_treatment',
            'low_stores',
            'prepare_for_winter',
          ]}
          selectedColor="amber"
          columns="cols-2"
          getLabel={option => t(`observations.reminder.${option}`)}
        />
      </div>
    </div>
  );
};
