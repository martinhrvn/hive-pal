import { useTranslation } from 'react-i18next';
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type FieldPath,
} from 'react-hook-form';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  findOverlappingSeasonPair,
  isDateInSeason,
  type Season,
} from 'shared-schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getSeasonLabel } from '@/utils/season-format';
import { MonthDayField } from './month-day-field';

interface SeasonListFormValues {
  seasons: Season[];
}

interface SeasonListFieldProps {
  /** Base hive inspection interval, shown as the override placeholder. */
  baseFrequencyDays?: number;
  disabled?: boolean;
}

/** A new, empty season. Dates are a starting point the user can change. */
function newSeason(): Season {
  return {
    id: crypto.randomUUID(),
    name: '',
    start: { month: 3, day: 1 },
    end: { month: 5, day: 31 },
    inspectionFrequencyDays: null,
    feeding: { enabled: false, targetKg: null },
  };
}

function OptionalNumberField({
  name,
  label,
  placeholder,
  disabled,
  min,
  max,
  step,
}: {
  name: FieldPath<SeasonListFormValues>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: string;
}) {
  const { control } = useFormContext<SeasonListFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              disabled={disabled}
              value={(field.value as number | null | undefined) ?? ''}
              onChange={event =>
                field.onChange(
                  event.target.value === '' ? null : event.target.valueAsNumber,
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SeasonCard({
  index,
  baseFrequencyDays,
  disabled,
  onRemove,
}: {
  index: number;
  baseFrequencyDays?: number;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const { t } = useTranslation(['common', 'hive']);
  const { control, setValue, getValues } =
    useFormContext<SeasonListFormValues>();
  const season = useWatch({ control, name: `seasons.${index}` }) as
    Season | undefined;
  const feedingEnabled = Boolean(season?.feeding?.enabled);
  const active = season ? isDateInSeason(season, new Date()) : false;

  return (
    <div className="space-y-4 rounded-lg border p-4" data-test="season-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <FormField
            control={control}
            name={`seasons.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common:season.name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('common:season.namePlaceholder')}
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                {!season?.name?.trim() && (
                  <p className="text-xs text-muted-foreground">
                    {t('common:season.unnamedHint')}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center gap-1 pt-6">
          {active && (
            <Badge variant="secondary">{t('common:season.activeNow')}</Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('common:season.remove')}
            disabled={disabled}
            onClick={onRemove}
            data-test="remove-season"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MonthDayField
          control={control}
          name={`seasons.${index}.start`}
          label={t('common:season.start')}
          disabled={disabled}
        />
        <MonthDayField
          control={control}
          name={`seasons.${index}.end`}
          label={t('common:season.end')}
          disabled={disabled}
        />
        <OptionalNumberField
          name={`seasons.${index}.inspectionFrequencyDays`}
          label={t('common:season.inspectionInterval')}
          placeholder={
            baseFrequencyDays ? String(baseFrequencyDays) : undefined
          }
          min={1}
          max={365}
          disabled={disabled}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t('common:season.inspectionIntervalHint')}
      </p>

      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`seasons.${index}.feeding.enabled`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>{t('common:season.feeding')}</FormLabel>
                <p className="text-xs text-muted-foreground">
                  {t('common:season.feedingHint')}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={Boolean(field.value)}
                  disabled={disabled}
                  onCheckedChange={checked => {
                    field.onChange(checked);
                    if (
                      checked &&
                      getValues(`seasons.${index}.feeding.targetKg`) == null
                    ) {
                      setValue(`seasons.${index}.feeding.targetKg`, 12, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {feedingEnabled && (
          <OptionalNumberField
            name={`seasons.${index}.feeding.targetKg`}
            label={t('common:season.feedingTarget')}
            placeholder="12"
            min={0.1}
            step="0.1"
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Editor for a form's `seasons` array. Used by the apiary season template and
 * by per-hive customisation. Validation is provided by the form schema
 * (`seasonListSchema`); overlapping seasons are also flagged inline.
 */
export function SeasonListField({
  baseFrequencyDays,
  disabled,
}: SeasonListFieldProps) {
  const { t } = useTranslation(['common', 'hive']);
  const { control } = useFormContext<SeasonListFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'seasons',
  });
  const seasons = useWatch({ control, name: 'seasons' }) as
    Season[] | undefined;
  const overlap = findOverlappingSeasonPair(seasons ?? []);
  const overlapLabel = (index: number) =>
    getSeasonLabel(seasons?.[index] ?? {}) ??
    t('common:season.unnamed', { number: index + 1 });

  return (
    <div className="space-y-4" data-test="season-list">
      {fields.length === 0 && (
        <p className="text-sm italic text-muted-foreground">
          {t('common:season.empty')}
        </p>
      )}

      {fields.map((field, index) => (
        <SeasonCard
          key={field.id}
          index={index}
          baseFrequencyDays={baseFrequencyDays}
          disabled={disabled}
          onRemove={() => remove(index)}
        />
      ))}

      {overlap && (
        <Alert variant="destructive" data-test="season-overlap">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common:season.overlapTitle')}</AlertTitle>
          <AlertDescription>
            {t('common:season.overlap', {
              first: overlapLabel(overlap[0]),
              second: overlapLabel(overlap[1]),
            })}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => append(newSeason())}
        data-test="add-season"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('common:season.add')}
      </Button>
    </div>
  );
}
