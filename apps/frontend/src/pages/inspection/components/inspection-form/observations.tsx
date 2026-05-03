import React from 'react';
import { FieldPath, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Minus, Plus, X } from 'lucide-react';
import { InspectionFormData } from './schema';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { AiBadge } from './ai-badge';
import { AiFieldControls } from './ai-field-controls';
import type { AiMergeState } from '@/pages/inspection/lib/inspection-ai-merge';
import { cn } from '@/lib/utils';
import { shouldUseAiPrefill } from '@/pages/inspection/lib/inspection-ai-merge';

type ObservationItemProps<TName extends FieldPath<InspectionFormData>> = {
  name: TName;
  label: string;
  description?: string;
  inputMode?: 'rating' | 'counter';
  max?: number;
  showAi?: boolean;
  aiValue?: unknown;
  useAiPrefill?: boolean;
  suggestionField?: string;
  suggestionStatus?: 'pending' | 'accepted' | 'dismissed';
  suggestionConflict?: boolean;
  onAcceptSuggestion?: (field: string) => void;
  onDismissSuggestion?: (field: string) => void;
};

const formatPreviewValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) {
    return (
      value
        .filter((item): item is string | number | boolean => {
          return (
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'
          );
        })
        .map(item => {
          const displayValue = typeof item === 'boolean' ? (item ? 'Yes' : 'No') : String(item);
          return displayValue;
        })
        .join(', ') || '—'
    );
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return value === '' ? '—' : value;
  if (typeof value === 'number') return String(value);
  return '—';
};

const toNumericValue = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const PreviewValuePill: React.FC<{
  label: string;
  value: unknown;
  variant?: 'current' | 'ai';
}> = ({ label, value, variant = 'current' }) => {
  return (
    <div
      className={cn(
        'rounded-md border px-2 py-1 text-xs',
        variant === 'ai'
          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300'
          : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300',
      )}
    >
      <span className="mr-1 font-medium">{label}:</span>
      <span>{formatPreviewValue(value)}</span>
    </div>
  );
};

const AiValuePreview: React.FC<{
  isVisible: boolean;
  hasConflict?: boolean;
  currentValue: unknown;
  aiValue: unknown;
  className?: string;
}> = ({ isVisible, hasConflict, currentValue, aiValue, className }) => {
  if (!isVisible) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {hasConflict ? (
        <>
          <PreviewValuePill label="Current" value={currentValue} />
          <PreviewValuePill label="AI" value={aiValue} variant="ai" />
        </>
      ) : (
        <PreviewValuePill label="AI" value={aiValue} variant="ai" />
      )}
    </div>
  );
};

const ObservationItem = <TName extends FieldPath<InspectionFormData>>({
  name,
  label,
  description,
  inputMode = 'rating',
  max,
  showAi = false,
  aiValue,
  useAiPrefill = false,
  suggestionField,
  suggestionStatus,
  suggestionConflict,
  onAcceptSuggestion,
  onDismissSuggestion,
}: ObservationItemProps<TName>) => {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);

  return (
    <div
      className={cn(
        'rounded-md p-2 transition-colors',
        showAi &&
          'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
      )}
    >
      <FormField
        control={control}
        name={name}
        render={({ field }) => {
          const currentValue = field.value as number | undefined | null;
          const aiNumericValue = toNumericValue(aiValue);
          const displayValue =
            useAiPrefill && aiNumericValue !== undefined
              ? aiNumericValue
              : currentValue;

          return (
            <FormItem>
              <FormControl>
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
                  <div className="min-w-32 w-32 pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">{label}</label>
                      {showAi && <AiBadge />}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    {description && (
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                    )}

                    {inputMode === 'counter' ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="outline"
                          type="button"
                          size="icon"
                          className="h-12 w-12 rounded-xl"
                          disabled={displayValue == null || displayValue <= 0}
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            field.onChange(Math.max(0, (displayValue ?? 0) - 1));
                          }}
                          aria-label={`Decrease ${label}`}
                        >
                          <Minus className="h-5 w-5" />
                        </Button>

                        <div className="flex min-w-20 flex-col items-center rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">
                          <span className="text-2xl font-semibold leading-none">
                            {displayValue ?? '—'}
                          </span>
                          {max != null && (
                            <span className="mt-1 text-xs text-muted-foreground">
                              / {max}
                            </span>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          type="button"
                          size="icon"
                          className="h-12 w-12 rounded-xl"
                          disabled={max != null && displayValue === max}
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();

                            const nextValue = (displayValue ?? 0) + 1;
                            field.onChange(
                              max == null ? nextValue : Math.min(max, nextValue),
                            );
                          }}
                          aria-label={`Increase ${label}`}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>

                        <Button
                          variant="ghost"
                          type="button"
                          disabled={displayValue == null}
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            field.onChange(undefined);
                          }}
                          aria-label={t('observations.clearRating')}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg',
                            displayValue === 0
                              ? 'bg-gray-600 text-white dark:bg-gray-300 dark:text-gray-900'
                              : 'bg-gray-100 dark:bg-gray-800',
                          )}
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            field.onChange(0);
                          }}
                          aria-label={t('observations.rateAs', { value: 0 })}
                        >
                          0
                        </button>

                        <div className="grid h-8 min-w-[220px] grow grid-cols-10 gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fullValue => {
                            let color = 'bg-gray-200 dark:bg-gray-700';

                            if (hoveredValue != null && hoveredValue >= fullValue) {
                              color = 'bg-amber-200 dark:bg-amber-800';
                            } else if (
                              displayValue != null &&
                              displayValue >= fullValue
                            ) {
                              color = 'bg-amber-300 dark:bg-amber-700';
                            }

                            return (
                              <button
                                key={fullValue}
                                type="button"
                                className={cn(
                                  'w-full rounded text-xs transition-colors duration-300',
                                  color,
                                  hoveredValue === fullValue
                                    ? 'text-gray-700 dark:text-gray-300'
                                    : 'text-transparent',
                                )}
                                onMouseEnter={() => setHoveredValue(fullValue)}
                                onMouseLeave={() => setHoveredValue(null)}
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  field.onChange(fullValue);
                                  setHoveredValue(null);
                                }}
                                aria-label={t('observations.rateAs', {
                                  value: fullValue,
                                })}
                              >
                                {hoveredValue === fullValue && hoveredValue}
                              </button>
                            );
                          })}
                        </div>

                        <div className="h-8 w-8 text-center">
                          <span className="block h-8 rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
                            {displayValue ?? '-'}
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          type="button"
                          disabled={displayValue == null}
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            field.onChange(undefined);
                          }}
                          aria-label={t('observations.clearRating')}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <AiValuePreview
                        isVisible={Boolean(suggestionField)}
                        hasConflict={suggestionConflict}
                        currentValue={currentValue}
                        aiValue={aiNumericValue}
                      />

                      <AiFieldControls
                        isVisible={Boolean(suggestionField)}
                        hasConflict={suggestionConflict}
                        status={suggestionStatus}
                        onAccept={() =>
                          suggestionField && onAcceptSuggestion?.(suggestionField)
                        }
                        onDismiss={() =>
                          suggestionField && onDismissSuggestion?.(suggestionField)
                        }
                      />
                    </div>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
};

type ObservationsSectionProps = {
  broodFrames?: number | null;
  broodBoxCount?: number | null;
  isSubjective?: boolean;
  isAiSuggested?: (field: string) => boolean;
  aiMergeState?: AiMergeState | null;
  onAcceptSuggestion?: (field: string) => void;
  onDismissSuggestion?: (field: string) => void;
};

export const ObservationsSection: React.FC<ObservationsSectionProps> = ({
  broodFrames,
  broodBoxCount,
  isSubjective = false,
  isAiSuggested,
  aiMergeState,
  onAcceptSuggestion,
  onDismissSuggestion,
}) => {
  const { t } = useTranslation('inspection');
  const form = useFormContext<InspectionFormData>();
  const { control, formState } = form;
  const queenCells = useWatch({ name: 'observations.queenCells', control });
  const currentObservations = useWatch({ name: 'observations', control });

  const strengthMax =
    broodFrames == null
      ? undefined
      : broodBoxCount == null
        ? broodFrames
        : broodFrames + broodBoxCount;

  const getObservationSuggestion = (
    key: keyof NonNullable<InspectionFormData['observations']>,
  ) => {
    const fieldPath = `observations.${key}`;
    return isAiSuggested?.(fieldPath)
      ? aiMergeState?.suggestions[fieldPath]
      : undefined;
  };

  const queenSeenSuggestion = getObservationSuggestion('queenSeen');
  const broodPatternSuggestion = getObservationSuggestion('broodPattern');
  const strengthSuggestion = getObservationSuggestion('strength');
  const uncappedBroodSuggestion = getObservationSuggestion('uncappedBrood');
  const cappedBroodSuggestion = getObservationSuggestion('cappedBrood');
  const honeyStoresSuggestion = getObservationSuggestion('honeyStores');
  const pollenStoresSuggestion = getObservationSuggestion('pollenStores');
  const queenCellsSuggestion = getObservationSuggestion('queenCells');
  const swarmCellsSuggestion = getObservationSuggestion('swarmCells');
  const supersedureCellsSuggestion = getObservationSuggestion('supersedureCells');
  const additionalSuggestion = getObservationSuggestion('additionalObservations');
  const reminderSuggestion = getObservationSuggestion('reminderObservations');

  const dirtyObservationFields = (formState.dirtyFields.observations ??
    {}) as Partial<
    Record<keyof NonNullable<InspectionFormData['observations']>, unknown>
  >;

  const hasAiField = (
    key: keyof NonNullable<InspectionFormData['observations']>,
  ) => Boolean(getObservationSuggestion(key));

  const shouldPrefillField = (
    key: keyof NonNullable<InspectionFormData['observations']>,
    currentValue: unknown,
  ) =>
    hasAiField(key) &&
    shouldUseAiPrefill(
      currentValue,
      !!dirtyObservationFields[key],
      getObservationSuggestion(key),
    );

  const shouldPrefillNumericField = (
    key: keyof NonNullable<InspectionFormData['observations']>,
    currentValue: unknown,
  ) => {
    const suggestion = getObservationSuggestion(key);
    const aiValue = suggestion?.aiValue;

    if (!suggestion) return false;
    if (suggestion.status !== 'pending') return false;
    if (dirtyObservationFields[key]) return false;
    if (toNumericValue(aiValue) === undefined) return false;

    return currentValue === null || currentValue === undefined;
  };

  const hasAnyObservationSuggestion = [
    'queenSeen',
    'broodPattern',
    'strength',
    'uncappedBrood',
    'cappedBrood',
    'honeyStores',
    'pollenStores',
    'queenCells',
    'swarmCells',
    'supersedureCells',
    'additionalObservations',
    'reminderObservations',
  ].some(key => isAiSuggested?.(`observations.${key}`));

  return (
    <div
      className={cn(
        'space-y-4 rounded-md p-3 transition-colors',
        hasAnyObservationSuggestion &&
          'border border-blue-200 bg-blue-50/20 dark:border-blue-900 dark:bg-blue-950/10',
      )}
      data-ai-field="observations"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-medium">
          <span>{t('observations.title')}</span>
          {hasAnyObservationSuggestion && <AiBadge />}
        </h3>
      </div>

      <div className="grid grid-cols-2 space-2 md:grid-cols-3">
        <FormField
          control={control}
          name="observations.queenSeen"
          render={({ field }) => {
            const currentValue = Boolean(field.value ?? false);
            const aiValue = Boolean(queenSeenSuggestion?.aiValue);
            const displayChecked = shouldPrefillField('queenSeen', field.value)
              ? aiValue
              : currentValue;

            return (
              <FormItem
                className={cn(
                  'flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow transition-colors',
                  queenSeenSuggestion &&
                    'border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
                )}
              >
                <FormControl>
                  <Checkbox
                    checked={displayChecked}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>

                <div className="min-w-0 flex-1 space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <span>{t('observations.queenSeen')}</span>
                    {queenSeenSuggestion && <AiBadge />}
                  </FormLabel>

                  <AiValuePreview
                    isVisible={Boolean(queenSeenSuggestion)}
                    hasConflict={queenSeenSuggestion?.hasConflict}
                    currentValue={currentValue}
                    aiValue={aiValue}
                  />

                  <AiFieldControls
                    isVisible={Boolean(queenSeenSuggestion)}
                    hasConflict={queenSeenSuggestion?.hasConflict}
                    status={queenSeenSuggestion?.status}
                    onAccept={() => onAcceptSuggestion?.('observations.queenSeen')}
                    onDismiss={() =>
                      onDismissSuggestion?.('observations.queenSeen')
                    }
                  />
                </div>

                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="col-span-3 mt-5 flex flex-col space-y-2">
          <ObservationItem
            name="observations.strength"
            label={t('observations.strength')}
            description={
              isSubjective
                ? undefined
                : 'Count the number of spaces between the frames that you can see are full of bees'
            }
            inputMode={isSubjective ? 'rating' : 'counter'}
            max={isSubjective ? undefined : strengthMax}
            showAi={Boolean(strengthSuggestion)}
            aiValue={strengthSuggestion?.aiValue}
            useAiPrefill={shouldPrefillNumericField(
              'strength',
              currentObservations?.strength,
            )}
            suggestionField={
              strengthSuggestion ? 'observations.strength' : undefined
            }
            suggestionStatus={strengthSuggestion?.status}
            suggestionConflict={strengthSuggestion?.hasConflict}
            onAcceptSuggestion={onAcceptSuggestion}
            onDismissSuggestion={onDismissSuggestion}
          />

          {isSubjective && (
            <>
              <ObservationItem
                name="observations.cappedBrood"
                label={t('observations.cappedBrood')}
                showAi={Boolean(cappedBroodSuggestion)}
                aiValue={cappedBroodSuggestion?.aiValue}
                useAiPrefill={shouldPrefillNumericField(
                  'cappedBrood',
                  currentObservations?.cappedBrood,
                )}
                suggestionField={
                  cappedBroodSuggestion ? 'observations.cappedBrood' : undefined
                }
                suggestionStatus={cappedBroodSuggestion?.status}
                suggestionConflict={cappedBroodSuggestion?.hasConflict}
                onAcceptSuggestion={onAcceptSuggestion}
                onDismissSuggestion={onDismissSuggestion}
              />

              <ObservationItem
                name="observations.uncappedBrood"
                label={t('observations.uncappedBrood')}
                showAi={Boolean(uncappedBroodSuggestion)}
                aiValue={uncappedBroodSuggestion?.aiValue}
                useAiPrefill={shouldPrefillNumericField(
                  'uncappedBrood',
                  currentObservations?.uncappedBrood,
                )}
                suggestionField={
                  uncappedBroodSuggestion ? 'observations.uncappedBrood' : undefined
                }
                suggestionStatus={uncappedBroodSuggestion?.status}
                suggestionConflict={uncappedBroodSuggestion?.hasConflict}
                onAcceptSuggestion={onAcceptSuggestion}
                onDismissSuggestion={onDismissSuggestion}
              />
            </>
          )}

          <div
            className={cn(
              'mt-4 rounded-md p-2 transition-colors',
              broodPatternSuggestion &&
                'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
            )}
          >
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

                const aiBroodPattern =
                  typeof broodPatternSuggestion?.aiValue === 'string'
                    ? broodPatternSuggestion.aiValue
                    : undefined;

                const displayValue = shouldPrefillField(
                  'broodPattern',
                  currentValue,
                )
                  ? aiBroodPattern
                  : currentValue;

                const selectPattern = (value: string) => {
                  field.onChange(displayValue === value ? null : value);
                };

                return (
                  <FormItem>
                    <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <span>{t('observations.broodPattern')}</span>
                        {broodPatternSuggestion && <AiBadge />}
                      </FormLabel>

                      <AiValuePreview
                        isVisible={Boolean(broodPatternSuggestion)}
                        hasConflict={broodPatternSuggestion?.hasConflict}
                        currentValue={currentValue}
                        aiValue={aiBroodPattern}
                      />

                      <AiFieldControls
                        isVisible={Boolean(broodPatternSuggestion)}
                        hasConflict={broodPatternSuggestion?.hasConflict}
                        status={broodPatternSuggestion?.status}
                        onAccept={() =>
                          onAcceptSuggestion?.('observations.broodPattern')
                        }
                        onDismiss={() =>
                          onDismissSuggestion?.('observations.broodPattern')
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {broodPatternOptions.map(option => {
                        const isAiRecommended = aiBroodPattern === option;

                        return (
                          <div
                            key={option}
                            className={cn(
                              'cursor-pointer rounded-md border p-2 text-center text-sm transition-colors',
                              displayValue === option
                                ? 'border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
                              broodPatternSuggestion &&
                                isAiRecommended &&
                                'ring-2 ring-blue-300 dark:ring-blue-700',
                            )}
                            onClick={() => selectPattern(option)}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>{t(`observations.broodPatternOptions.${option}`)}</span>
                              {broodPatternSuggestion && isAiRecommended && (
                                <AiBadge />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          {isSubjective && (
            <>
              <ObservationItem
                name="observations.honeyStores"
                label={t('observations.honeyStores')}
                showAi={Boolean(honeyStoresSuggestion)}
                aiValue={honeyStoresSuggestion?.aiValue}
                useAiPrefill={shouldPrefillNumericField(
                  'honeyStores',
                  currentObservations?.honeyStores,
                )}
                suggestionField={
                  honeyStoresSuggestion ? 'observations.honeyStores' : undefined
                }
                suggestionStatus={honeyStoresSuggestion?.status}
                suggestionConflict={honeyStoresSuggestion?.hasConflict}
                onAcceptSuggestion={onAcceptSuggestion}
                onDismissSuggestion={onDismissSuggestion}
              />

              <ObservationItem
                name="observations.pollenStores"
                label={t('observations.pollenStores')}
                showAi={Boolean(pollenStoresSuggestion)}
                aiValue={pollenStoresSuggestion?.aiValue}
                useAiPrefill={shouldPrefillNumericField(
                  'pollenStores',
                  currentObservations?.pollenStores,
                )}
                suggestionField={
                  pollenStoresSuggestion ? 'observations.pollenStores' : undefined
                }
                suggestionStatus={pollenStoresSuggestion?.status}
                suggestionConflict={pollenStoresSuggestion?.hasConflict}
                onAcceptSuggestion={onAcceptSuggestion}
                onDismissSuggestion={onDismissSuggestion}
              />
            </>
          )}

          <ObservationItem
            name="observations.queenCells"
            label={t('observations.queenCells')}
            inputMode="counter"
            showAi={Boolean(queenCellsSuggestion)}
            aiValue={queenCellsSuggestion?.aiValue}
            useAiPrefill={shouldPrefillNumericField(
              'queenCells',
              currentObservations?.queenCells,
            )}
            suggestionField={
              queenCellsSuggestion ? 'observations.queenCells' : undefined
            }
            suggestionStatus={queenCellsSuggestion?.status}
            suggestionConflict={queenCellsSuggestion?.hasConflict}
            onAcceptSuggestion={onAcceptSuggestion}
            onDismissSuggestion={onDismissSuggestion}
          />

          {(queenCells ?? 0) > 0 && (
            <div className="grid grid-cols-2 space-x-2">
              <FormField
                control={control}
                name="observations.swarmCells"
                render={({ field }) => {
                  const currentValue = Boolean(field.value ?? false);
                  const aiValue = Boolean(swarmCellsSuggestion?.aiValue);
                  const displayChecked = shouldPrefillField(
                    'swarmCells',
                    field.value,
                  )
                    ? aiValue
                    : currentValue;

                  return (
                    <FormItem
                      className={cn(
                        'flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 shadow transition-colors',
                        swarmCellsSuggestion &&
                          'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
                      )}
                    >
                      <FormControl>
                        <Checkbox
                          checked={displayChecked}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>

                       <div className="min-w-0 flex-1 space-y-2">
                         <FormLabel className="flex items-center gap-2">
                           <span>{t('observations.swarmCells')}</span>
                           {swarmCellsSuggestion && <AiBadge />}
                         </FormLabel>

                         <p className="text-xs text-muted-foreground">
                           {t('observations.swarmCellsDescription')}
                         </p>

                         <AiValuePreview
                           isVisible={Boolean(swarmCellsSuggestion)}
                           hasConflict={swarmCellsSuggestion?.hasConflict}
                          currentValue={currentValue}
                          aiValue={aiValue}
                        />

                        <AiFieldControls
                          isVisible={Boolean(swarmCellsSuggestion)}
                          hasConflict={swarmCellsSuggestion?.hasConflict}
                          status={swarmCellsSuggestion?.status}
                          onAccept={() =>
                            onAcceptSuggestion?.('observations.swarmCells')
                          }
                          onDismiss={() =>
                            onDismissSuggestion?.('observations.swarmCells')
                          }
                        />
                      </div>

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={control}
                name="observations.supersedureCells"
                render={({ field }) => {
                  const currentValue = Boolean(field.value ?? false);
                  const aiValue = Boolean(supersedureCellsSuggestion?.aiValue);
                  const displayChecked = shouldPrefillField(
                    'supersedureCells',
                    field.value,
                  )
                    ? aiValue
                    : currentValue;

                  return (
                    <FormItem
                      className={cn(
                        'flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 shadow transition-colors',
                        supersedureCellsSuggestion &&
                          'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
                      )}
                    >
                      <FormControl>
                        <Checkbox
                          checked={displayChecked}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>

                       <div className="min-w-0 flex-1 space-y-2">
                         <FormLabel className="flex items-center gap-2">
                           <span>{t('observations.supersedureCells')}</span>
                           {supersedureCellsSuggestion && <AiBadge />}
                         </FormLabel>

                         <p className="text-xs text-muted-foreground">
                           {t('observations.supersedureCellsDescription')}
                         </p>

                         <AiValuePreview
                           isVisible={Boolean(supersedureCellsSuggestion)}
                           hasConflict={supersedureCellsSuggestion?.hasConflict}
                          currentValue={currentValue}
                          aiValue={aiValue}
                        />

                        <AiFieldControls
                          isVisible={Boolean(supersedureCellsSuggestion)}
                          hasConflict={supersedureCellsSuggestion?.hasConflict}
                          status={supersedureCellsSuggestion?.status}
                          onAccept={() =>
                            onAcceptSuggestion?.('observations.supersedureCells')
                          }
                          onDismiss={() =>
                            onDismissSuggestion?.('observations.supersedureCells')
                          }
                        />
                      </div>

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          )}

          <div
            className={cn(
              'mt-6 rounded-md p-2 transition-colors',
              additionalSuggestion &&
                'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
            )}
          >
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h4 className="flex items-center gap-2 text-md font-medium">
                <span>{t('observations.additionalObservations')}</span>
                {additionalSuggestion && <AiBadge />}
              </h4>

              <AiValuePreview
                isVisible={Boolean(additionalSuggestion)}
                hasConflict={additionalSuggestion?.hasConflict}
                currentValue={
                  Array.isArray(currentObservations?.additionalObservations)
                    ? currentObservations.additionalObservations
                    : []
                }
                aiValue={
                  Array.isArray(additionalSuggestion?.aiValue)
                    ? additionalSuggestion.aiValue
                    : []
                }
              />

              <AiFieldControls
                isVisible={Boolean(additionalSuggestion)}
                hasConflict={additionalSuggestion?.hasConflict}
                status={additionalSuggestion?.status}
                onAccept={() =>
                  onAcceptSuggestion?.('observations.additionalObservations')
                }
                onDismiss={() =>
                  onDismissSuggestion?.('observations.additionalObservations')
                }
              />
            </div>

            <FormField
              control={control}
              name="observations.additionalObservations"
              render={({ field }) => {
                const currentValues: string[] = field.value || [];
                const availableOptions = [
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
                ];
                const aiValues = Array.isArray(additionalSuggestion?.aiValue)
                  ? (additionalSuggestion.aiValue as string[])
                  : [];

                const displayValues = shouldPrefillField(
                  'additionalObservations',
                  currentValues,
                )
                  ? aiValues
                  : currentValues;

                const toggleObservation = (value: string) => {
                  const updated = displayValues.includes(value)
                    ? displayValues.filter(v => v !== value)
                    : [...displayValues, value];
                  field.onChange(updated);
                };

                return (
                  <FormItem>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                      {availableOptions.map(option => {
                        const isAiRecommended =
                          additionalSuggestion && aiValues.includes(option);

                        return (
                          <div
                            key={option}
                            className={cn(
                              'cursor-pointer rounded-md border p-2 text-center text-sm transition-colors',
                              displayValues.includes(option)
                                ? 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
                              isAiRecommended &&
                                'ring-2 ring-blue-300 dark:ring-blue-700',
                            )}
                            onClick={() => toggleObservation(option)}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>{t(`observations.additional.${option}`)}</span>
                              {isAiRecommended && <AiBadge />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <div
            className={cn(
              'mt-6 rounded-md p-2 transition-colors',
              reminderSuggestion &&
                'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
            )}
          >
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h4 className="flex items-center gap-2 text-md font-medium">
                <span>{t('observations.reminderObservations')}</span>
                {reminderSuggestion && <AiBadge />}
              </h4>

              <AiValuePreview
                isVisible={Boolean(reminderSuggestion)}
                hasConflict={reminderSuggestion?.hasConflict}
                currentValue={
                  Array.isArray(currentObservations?.reminderObservations)
                    ? currentObservations.reminderObservations
                    : []
                }
                aiValue={
                  Array.isArray(reminderSuggestion?.aiValue)
                    ? reminderSuggestion.aiValue
                    : []
                }
              />

              <AiFieldControls
                isVisible={Boolean(reminderSuggestion)}
                hasConflict={reminderSuggestion?.hasConflict}
                status={reminderSuggestion?.status}
                onAccept={() =>
                  onAcceptSuggestion?.('observations.reminderObservations')
                }
                onDismiss={() =>
                  onDismissSuggestion?.('observations.reminderObservations')
                }
              />
            </div>

            <FormField
              control={control}
              name="observations.reminderObservations"
              render={({ field }) => {
                const currentValues = field.value || [];
                const availableOptions = [
                  'honey_bound',
                  'overcrowded',
                  'needs_super',
                  'queen_issues',
                  'requires_treatment',
                  'low_stores',
                  'prepare_for_winter',
                ];
                const aiValues = Array.isArray(reminderSuggestion?.aiValue)
                  ? (reminderSuggestion.aiValue as string[])
                  : [];

                const displayValues = shouldPrefillField(
                  'reminderObservations',
                  currentValues,
                )
                  ? aiValues
                  : currentValues;

                const toggleObservation = (value: string) => {
                  const updated = displayValues.includes(value)
                    ? displayValues.filter(v => v !== value)
                    : [...displayValues, value];
                  field.onChange(updated);
                };

                return (
                  <FormItem>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {availableOptions.map(option => {
                        const isAiRecommended =
                          reminderSuggestion && aiValues.includes(option);

                        return (
                          <div
                            key={option}
                            className={cn(
                              'cursor-pointer rounded-md border p-2 text-center text-sm transition-colors',
                              displayValues.includes(option)
                                ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
                              isAiRecommended &&
                                'ring-2 ring-blue-300 dark:ring-blue-700',
                            )}
                            onClick={() => toggleObservation(option)}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>{t(`observations.reminder.${option}`)}</span>
                              {isAiRecommended && <AiBadge />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
