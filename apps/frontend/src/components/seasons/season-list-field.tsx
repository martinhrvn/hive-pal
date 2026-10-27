import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext, useWatch } from 'react-hook-form';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { NumberField } from '@/components/common/number-field';
import { formatSeasonRange, getSeasonLabel } from '@/utils/season-format';
import {
  useSeasonEditor,
  type SeasonFormValues,
} from './season-editor-context';
import { MonthDayField } from './month-day-field';
import { SeasonSummaryRow } from './season-summary-list';

interface SeasonListFieldProps {
  /** Base hive inspection interval, shown as the override placeholder. */
  baseFrequencyDays?: number;
  disabled?: boolean;
}

interface SeasonCardProps {
  index: number;
  editing: boolean;
  baseFrequencyDays?: number;
  disabled?: boolean;
  onEdit: () => void;
  onDone: () => void;
  onRemove: () => void;
}

/**
 * A season reads as a summary row until it is expanded. Expanding is explicit
 * (the pencil, or clicking its segment on the year strip), so saving the
 * schedule never collapses the editor you are working in.
 */
function SeasonCard({
  index,
  editing,
  baseFrequencyDays,
  disabled,
  onEdit,
  onDone,
  onRemove,
}: SeasonCardProps) {
  const { t } = useTranslation('common');
  const { control } = useFormContext<SeasonFormValues>();
  const season = useWatch({ control, name: `seasons.${index}` }) as
    Season | undefined;

  if (!season) return null;

  if (!editing) {
    return (
      <div className="rounded-lg border p-3" data-test="season-card">
        <SeasonSummaryRow season={season}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('season.edit')}
            disabled={disabled}
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
            disabled={disabled}
            onClick={onRemove}
            data-test="remove-season"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </SeasonSummaryRow>
      </div>
    );
  }

  return (
    <SeasonEditor
      index={index}
      season={season}
      baseFrequencyDays={baseFrequencyDays}
      disabled={disabled}
      onDone={onDone}
      onRemove={onRemove}
    />
  );
}

function SeasonEditor({
  index,
  season,
  baseFrequencyDays,
  disabled,
  onDone,
  onRemove,
}: {
  index: number;
  season: Season;
  baseFrequencyDays?: number;
  disabled?: boolean;
  onDone: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation('common');
  const { control, setValue, getValues } = useFormContext<SeasonFormValues>();
  const active = isDateInSeason(season, new Date());
  const ref = useRef<HTMLDivElement>(null);

  // When opened from the year strip (off-screen), bring the editor into view.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  return (
    <div
      ref={ref}
      className="space-y-4 rounded-lg border p-4"
      data-test="season-card"
    >
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
          <NumberField
            control={control}
            name={`seasons.${index}.inspectionFrequencyDays`}
            label={t('season.inspectionInterval')}
            description={t('season.inspectionIntervalHint')}
            placeholder={
              baseFrequencyDays ? String(baseFrequencyDays) : undefined
            }
            min={1}
            max={365}
            disabled={disabled}
            nullable
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
          <NumberField
            control={control}
            name={`seasons.${index}.feeding.targetKg`}
            label={t('season.feedingTarget')}
            placeholder="12"
            min={0.1}
            step="0.1"
            disabled={disabled}
            nullable
          />
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onDone}
          data-test="done-season"
        >
          {t('season.done')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Editor for a form's `seasons` array. Used by the apiary season template and
 * by per-hive customisation. Validation is provided by the form schema
 * (`seasonListSchema`); overlapping seasons are also flagged inline.
 *
 * Seasons expand and collapse explicitly; the form's save does not touch the
 * open/closed state.
 */
export function SeasonListField({
  baseFrequencyDays,
  disabled,
}: SeasonListFieldProps) {
  const { t, i18n } = useTranslation('common');
  const { control } = useFormContext<SeasonFormValues>();
  const editor = useSeasonEditor();
  const seasons = useWatch({ control, name: 'seasons' }) as
    Season[] | undefined;

  // Outside a SeasonsEditorProvider (e.g. a read-only embed) there is nothing
  // to edit.
  if (!editor) return null;

  const { fields, editingIds, setEditing, addSeason, removeSeason } = editor;

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
            editing={editingIds.has(seasonId)}
            baseFrequencyDays={baseFrequencyDays}
            disabled={disabled}
            onEdit={() => setEditing(seasonId, true)}
            onDone={() => setEditing(seasonId, false)}
            onRemove={() => removeSeason(seasonId)}
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
        onClick={() => addSeason()}
        data-test="add-season"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('season.add')}
      </Button>
    </div>
  );
}
