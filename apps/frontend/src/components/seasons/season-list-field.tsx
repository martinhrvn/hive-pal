import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
  type FieldPath,
} from 'react-hook-form';
import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  findOverlappingSeasonPair,
  isBuiltInSeasonId,
  isDateInSeason,
  type Season,
} from 'shared-schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { randomUUID } from '@/lib/uuid';
import { formatSeasonRange, getSeasonLabel } from '@/utils/season-format';
import { MonthDayField } from './month-day-field';
import { SeasonSummaryRow } from './season-summary-list';

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
    id: randomUUID(),
    name: '',
    start: { month: 3, day: 1 },
    end: { month: 5, day: 31 },
    inspectionFrequencyDays: null,
    feeding: { enabled: false, targetKg: null },
  };
}

const cloneSeason = (season: Season): Season => ({
  ...season,
  start: { ...season.start },
  end: { ...season.end },
  feeding: { ...season.feeding },
});

/** True when the form's season still matches what was last saved. */
const isSameSeason = (a: Season, b: Season) =>
  a.name === b.name &&
  a.start.month === b.start.month &&
  a.start.day === b.start.day &&
  a.end.month === b.end.month &&
  a.end.day === b.end.day &&
  (a.inspectionFrequencyDays ?? null) === (b.inspectionFrequencyDays ?? null) &&
  Boolean(a.inspectionsPaused) === Boolean(b.inspectionsPaused) &&
  a.feeding.enabled === b.feeding.enabled &&
  (a.feeding.targetKg ?? null) === (b.feeding.targetKg ?? null);

function OptionalNumberField({
  name,
  label,
  description,
  placeholder,
  disabled,
  min,
  max,
  step,
}: {
  name: FieldPath<SeasonListFormValues>;
  label: string;
  description?: string;
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
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface SeasonCardProps {
  index: number;
  /** The season as last saved; `undefined` for a season added since. */
  saved?: Season;
  editing: boolean;
  baseFrequencyDays?: number;
  disabled?: boolean;
  onEdit: () => void;
  onDoneEditing: () => void;
  onRemove: () => void;
}

/**
 * A saved season reads as a summary row until the user edits it. New,
 * changed or invalid seasons always show the editor.
 */
function SeasonCard({
  index,
  saved,
  editing,
  onEdit,
  onDoneEditing,
  ...props
}: SeasonCardProps) {
  const { t } = useTranslation('common');
  const { control, setValue, getFieldState } =
    useFormContext<SeasonListFormValues>();
  const formState = useFormState({ control, name: `seasons.${index}` });
  const season = useWatch({ control, name: `seasons.${index}` }) as
    Season | undefined;
  const invalid = getFieldState(`seasons.${index}`, formState).invalid;

  if (!season) return null;

  const showEditor =
    editing || !saved || invalid || !isSameSeason(season, saved);

  if (!showEditor) {
    return (
      <div className="rounded-lg border p-3" data-test="season-card">
        <SeasonSummaryRow season={season}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('season.edit')}
            disabled={props.disabled}
            onClick={onEdit}
            data-test="edit-season"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('season.remove')}
            disabled={props.disabled}
            onClick={props.onRemove}
            data-test="remove-season"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </SeasonSummaryRow>
      </div>
    );
  }

  // Cancel only makes sense for a season that has a saved version to restore.
  const onCancel = saved
    ? () => {
        setValue(`seasons.${index}`, cloneSeason(saved), {
          shouldDirty: true,
          shouldValidate: true,
        });
        onDoneEditing();
      }
    : undefined;

  return (
    <SeasonEditor
      index={index}
      season={season}
      onCancel={onCancel}
      {...props}
    />
  );
}

function SeasonEditor({
  index,
  season,
  baseFrequencyDays,
  disabled,
  onCancel,
  onRemove,
}: {
  index: number;
  season: Season;
  baseFrequencyDays?: number;
  disabled?: boolean;
  onCancel?: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation('common');
  const { control, setValue, getValues } =
    useFormContext<SeasonListFormValues>();
  const active = isDateInSeason(season, new Date());

  return (
    <div className="space-y-4 rounded-lg border p-4" data-test="season-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <FormField
            control={control}
            name={`seasons.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('season.name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('season.namePlaceholder')}
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                {!season.name?.trim() && isBuiltInSeasonId(season.id) && (
                  <p className="text-xs text-muted-foreground">
                    {t('season.unnamedHint')}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center gap-1 pt-6">
          {active && <Badge variant="secondary">{t('season.activeNow')}</Badge>}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('season.remove')}
            disabled={disabled}
            onClick={onRemove}
            data-test="remove-season"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MonthDayField
          control={control}
          name={`seasons.${index}.start`}
          label={t('season.start')}
          disabled={disabled}
        />
        <MonthDayField
          control={control}
          name={`seasons.${index}.end`}
          label={t('season.end')}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`seasons.${index}.inspectionsPaused`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>{t('season.inspections')}</FormLabel>
                <p className="text-xs text-muted-foreground">
                  {t('season.inspectionsHint')}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={!field.value}
                  disabled={disabled}
                  data-test="season-inspections"
                  onCheckedChange={checked => {
                    field.onChange(!checked);
                    // A paused season has no interval to override.
                    if (!checked) {
                      setValue(
                        `seasons.${index}.inspectionFrequencyDays`,
                        null,
                        {
                          shouldDirty: true,
                        },
                      );
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {!season.inspectionsPaused && (
          <OptionalNumberField
            name={`seasons.${index}.inspectionFrequencyDays`}
            label={t('season.inspectionInterval')}
            description={t('season.inspectionIntervalHint')}
            placeholder={
              baseFrequencyDays ? String(baseFrequencyDays) : undefined
            }
            min={1}
            max={365}
            disabled={disabled}
          />
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`seasons.${index}.feeding.enabled`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>{t('season.feeding')}</FormLabel>
                <p className="text-xs text-muted-foreground">
                  {t('season.feedingHint')}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={Boolean(field.value)}
                  disabled={disabled}
                  data-test="season-feeding"
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

        {season.feeding.enabled && (
          <OptionalNumberField
            name={`seasons.${index}.feeding.targetKg`}
            label={t('season.feedingTarget')}
            placeholder="12"
            min={0.1}
            step="0.1"
            disabled={disabled}
          />
        )}
      </div>

      {onCancel && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onCancel}
            data-test="cancel-season-edit"
          >
            {t('actions.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Editor for a form's `seasons` array. Used by the apiary season template and
 * by per-hive customisation. Validation is provided by the form schema
 * (`seasonListSchema`); overlapping seasons are also flagged inline.
 *
 * Seasons that match the form's default values (what was last saved) show as
 * summary rows; resetting the form after a save collapses edited seasons back
 * into rows.
 */
export function SeasonListField({
  baseFrequencyDays,
  disabled,
}: SeasonListFieldProps) {
  const { t, i18n } = useTranslation('common');
  const { control, formState } = useFormContext<SeasonListFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'seasons',
  });
  const seasons = useWatch({ control, name: 'seasons' }) as
    Season[] | undefined;
  const savedSeasons = formState.defaultValues?.seasons as Season[] | undefined;
  const [editingIds, setEditingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // A form reset (after saving) closes every open editor.
  const [prevSavedSeasons, setPrevSavedSeasons] = useState(savedSeasons);
  if (savedSeasons !== prevSavedSeasons) {
    setPrevSavedSeasons(savedSeasons);
    setEditingIds(new Set());
  }

  const setEditing = (id: string, editing: boolean) =>
    setEditingIds(current => {
      const next = new Set(current);
      if (editing) next.add(id);
      else next.delete(id);
      return next;
    });

  const overlap = findOverlappingSeasonPair(seasons ?? []);
  // Unnamed seasons are told apart by their dates.
  const overlapLabel = (index: number) => {
    const season = seasons?.[index];
    if (!season) return '';
    return getSeasonLabel(season) ?? formatSeasonRange(season, i18n.language);
  };

  return (
    <div className="space-y-4" data-test="season-list">
      {fields.length === 0 && (
        <p className="text-sm italic text-muted-foreground">
          {t('season.empty')}
        </p>
      )}

      {fields.map((field, index) => {
        // `field.id` is the field array's own key, not the season id.
        const seasonId = seasons?.[index]?.id ?? field.id;
        return (
          <SeasonCard
            key={field.id}
            index={index}
            saved={savedSeasons?.find(season => season.id === seasonId)}
            editing={editingIds.has(seasonId)}
            baseFrequencyDays={baseFrequencyDays}
            disabled={disabled}
            onEdit={() => setEditing(seasonId, true)}
            onDoneEditing={() => setEditing(seasonId, false)}
            onRemove={() => remove(index)}
          />
        );
      })}

      {overlap && (
        <Alert variant="destructive" data-test="season-overlap">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('season.overlapTitle')}</AlertTitle>
          <AlertDescription>
            {t('season.overlap', {
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
        {t('season.add')}
      </Button>
    </div>
  );
}
