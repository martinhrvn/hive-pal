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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { InspectionFormData } from './schema';
import { Checkbox } from '@/components/ui/checkbox.tsx';

type ObservationItemProps<T> = {
  name: T;
  label: string;
};
const ObservationItem = <TName extends FieldPath<InspectionFormData>>({
  name,
  label,
}: ObservationItemProps<TName>) => {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue = field.value as number | undefined;
        return (
          <FormItem>
            <FormControl>
              <div className="flex md:items-center mb-4 flex-col md:flex-row gap-2 md:gap-2">
                <div className="w-32 min-w-32 mr-4">
                  <label className="text-sm font-medium">{label}</label>
                </div>

                <div className="flex-1">
                  {/* Rating bar with half points */}
                  <div className="flex items-center mb-2">
                    {/* Zero value button */}
                    <button
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2 ${
                        currentValue === 0
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100'
                      }`}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        field.onChange(0);
                      }}
                      aria-label={t('observations.rateAs', { value: 0 })}
                    >
                      0
                    </button>

                    {/* Half point rating buttons */}
                    <div className="grow grid grid-cols-10 gap-1 h-8">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fullValue => {
                        let color = 'bg-gray-200';
                        if (hoveredValue != null && hoveredValue >= fullValue) {
                          color = 'bg-amber-200';
                        } else if (
                          currentValue != null &&
                          currentValue >= fullValue
                        ) {
                          color = 'bg-amber-300';
                        }

                        return (
                          <button
                            className={`rounded w-full duration-300 transition-colors text-xs ${color} ${hoveredValue === fullValue ? 'text-gray-700' : 'text-transparent'}`}
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

                    {/* Value display */}
                    <div className="ml-4 w-8 h-8 text-center">
                      <span className="text-sm px-2 py-1 h-8 block bg-gray-100 rounded">
                        {currentValue ?? '-'}
                      </span>
                    </div>

                    <Button
                      variant={'ghost'}
                      disabled={currentValue === null}
                      className="ml-2 text-gray-400 hover:text-red-500"
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
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export const ObservationsSection: React.FC = () => {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();
  const queenCells = useWatch({ name: 'observations.queenCells', control });
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t('observations.title')}</h3>
      </div>

      <div className={'grid md:grid-cols-3 grid-cols-2 space-2'}>
        <FormField
          control={control}
          name={`observations.queenSeen`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>{t('observations.queenSeen')}</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col col-span-3 space-y-2 mt-5">
          <ObservationItem
            key={'strength'}
            name={'observations.strength'}
            label={t('observations.strength')}
          />
          <ObservationItem
            key={'cappedBrood'}
            name={'observations.cappedBrood'}
            label={t('observations.cappedBrood')}
          />
          <ObservationItem
            key={'uncappedBrood'}
            name={'observations.uncappedBrood'}
            label={t('observations.uncappedBrood')}
          />

          {/* Brood Pattern Badges (Single Select) */}
          <div className="mt-4">
            <FormField
              control={control}
              name="observations.broodPattern"
              render={({ field }) => {
                const currentValue = field.value;
                const broodPatternOptions = [
                  'solid', 'spotty', 'scattered', 'patchy', 'excellent', 'poor'
                ];
                
                const selectPattern = (value: string) => {
                  // If clicking the same value, deselect it
                  field.onChange(currentValue === value ? null : value);
                };
                
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('observations.broodPattern')}
                    </FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {broodPatternOptions.map(option => (
                        <div
                          key={option}
                          className={`cursor-pointer p-2 rounded-md border text-center text-sm transition-colors ${
                            currentValue === option
                              ? 'bg-green-100 border-green-300 text-green-800'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => selectPattern(option)}
                        >
                          {t(`observations.broodPatternOptions.${option}`)}
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <ObservationItem
            key={'honeyStores'}
            name={'observations.honeyStores'}
            label={t('observations.honeyStores')}
          />
          <ObservationItem
            key={'pollenStores'}
            name={'observations.pollenStores'}
            label={t('observations.pollenStores')}
          />

          <ObservationItem
            key={'queenCells'}
            name={'observations.queenCells'}
            label={t('observations.queenCells')}
          />
          {(queenCells ?? 0) > 0 && (
            <div className={'grid grid-cols-2 space-x-2'}>
              <FormField
                control={control}
                name={`observations.swarmCells`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>{t('observations.swarmCells')}</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`observations.supersedureCells`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>{t('observations.supersedureCells')}</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Additional Observations (Badges/Tags) */}
          <div className="mt-6">
            <h4 className="text-md font-medium mb-3">
              {t('observations.additionalObservations')}
            </h4>
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

                const toggleObservation = (value: string) => {
                  const updated = currentValues.includes(value)
                    ? currentValues.filter(v => v !== value)
                    : [...currentValues, value];
                  field.onChange(updated);
                };

                return (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {availableOptions.map(option => (
                        <div
                          key={option}
                          className={`cursor-pointer p-2 rounded-md border text-center text-sm transition-colors ${
                            currentValues.includes(option)
                              ? 'bg-blue-100 border-blue-300 text-blue-800'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleObservation(option)}
                        >
                          {t(`observations.additional.${option}`)}
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          {/* Reminder Observations */}
          <div className="mt-6">
            <h4 className="text-md font-medium mb-3">
              {t('observations.reminderObservations')}
            </h4>
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

                const toggleObservation = (value: string) => {
                  const updated = currentValues.includes(value)
                    ? currentValues.filter(v => v !== value)
                    : [...currentValues, value];
                  field.onChange(updated);
                };

                return (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {availableOptions.map(option => (
                        <div
                          key={option}
                          className={`cursor-pointer p-2 rounded-md border text-center text-sm transition-colors ${
                            currentValues.includes(option)
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleObservation(option)}
                        >
                          {t(`observations.reminder.${option}`)}
                        </div>
                      ))}
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
