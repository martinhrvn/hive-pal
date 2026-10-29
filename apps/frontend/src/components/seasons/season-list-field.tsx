import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext, useWatch, type FieldPath } from 'react-hook-form';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  findOverlappingSeasonPair,
  isBuiltInSeasonId,
  isDateInSeason,
  type Season,
} from 'shared-schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { NumberField } from '@/components/common/number-field';
import { StatusPill } from '@/components/common/status-pill';
import { formatSeasonRange, getSeasonLabel } from '@/utils/season-format';
import {
  claimSeasonDays,
  sharedRange,
  type ShortenedSeason,
} from '@/utils/season-strip';
import {
  useSeasonEditor,
  type SeasonFormValues,
} from './season-editor-context';
import { MonthDayField } from './month-day-field';
import { SeasonSummaryRow } from './season-summary-list';

/** Feeding target a season starts with when feeding is switched on. */
const DEFAULT_FEEDING_TARGET_KG = 12;

interface SeasonListFieldProps {
  /** Base hive inspection interval, shown as the override placeholder. */
  baseFrequencyDays?: number;
}

interface SeasonRowProps {
  index: number;
  editing: boolean;
  baseFrequencyDays?: number;
  onEdit: () => void;
  onDone: () => void;
  onRemove: () => void;
}

/**
 * A season reads as a summary row until it is expanded. Expanding is explicit
 * (clicking the row, or its segment on the year strip), so saving the
 * schedule never collapses the editor you are working in.
 */
function SeasonRow({
  index,
  editing,
  baseFrequencyDays,
  onEdit,
  onDone,
  onRemove,
}: Readonly<SeasonRowProps>) {
  const { t } = useTranslation('common');
  const { control } = useFormContext<SeasonFormValues>();
  const season = useWatch({ control, name: `seasons.${index}` }) as
    Season | undefined;

  if (!season) return null;

  if (editing) {
    return (
      <SeasonEditor
        index={index}
        season={season}
        baseFrequencyDays={baseFrequencyDays}
        onDone={onDone}
        onRemove={onRemove}
      />
    );
  }

  return (
    <li className="flex items-center gap-1 pr-2" data-test="season-card">
      <button
        type="button"
        aria-expanded={false}
        onClick={onEdit}
        data-test="edit-season"
        className="min-w-0 flex-1 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <SeasonSummaryRow
          season={season}
          baseFrequencyDays={baseFrequencyDays}
        />
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('season.remove')}
        onClick={onRemove}
        data-test="remove-season"
        className="text-muted-foreground"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

/**
 * A switch with its label and hint, and the value it unlocks below it (an
 * interval, a feeding target) while it is on.
 */
function ToggleRow({
  name,
  label,
  hint,
  inverted = false,
  testId,
  onToggle,
  children,
}: Readonly<{
  name: FieldPath<SeasonFormValues>;
  label: string;
  hint: string;
  /** The field stores the opposite of the switch (`inspectionsPaused`). */
  inverted?: boolean;
  testId: string;
  /** Runs after the field changes, with the switch's new state. */
  onToggle?: (on: boolean) => void;
  children?: ReactNode;
}>) {
  const { control } = useFormContext<SeasonFormValues>();

  return (
    <div className="space-y-3">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-3">
            <FormControl>
              <Switch
                checked={inverted ? !field.value : Boolean(field.value)}
                data-test={testId}
                className="mt-0.5"
                onCheckedChange={on => {
                  field.onChange(inverted ? !on : on);
                  onToggle?.(on);
                }}
              />
            </FormControl>
            <div className="space-y-0.5">
              <FormLabel>{label}</FormLabel>
              <FormDescription className="text-xs">{hint}</FormDescription>
            </div>
          </FormItem>
        )}
      />
      {/* Indented to the label, past the switch. */}
      {children && <div className="max-w-xs pl-11">{children}</div>}
    </div>
  );
}

const DATE_UPDATE = { shouldDirty: true, shouldValidate: true } as const;
const EDGES = ['start', 'end'] as const;

/**
 * A season's start and end. Picking a day another season holds shortens that
 * season to make room, with an undo; days that would swallow or split another
 * season can't be picked.
 */
function SeasonDates({
  index,
  season,
}: Readonly<{
  index: number;
  season: Season;
}>) {
  const { t, i18n } = useTranslation('common');
  const { control, setValue } = useFormContext<SeasonFormValues>();
  const seasons = (useWatch({ control, name: 'seasons' }) ?? []) as Season[];
  const [undo, setUndo] = useState<{
    shortened: ShortenedSeason[];
    previous: ShortenedSeason[];
  } | null>(null);

  const others = seasons.filter((_, otherIndex) => otherIndex !== index);
  const withEdge = (edge: (typeof EDGES)[number], day: Season['start']) => ({
    start: season.start,
    end: season.end,
    [edge]: day,
  });
  const writeRanges = (ranges: ShortenedSeason[]) => {
    for (const range of ranges) {
      setValue(`seasons.${range.index}.start`, range.start, DATE_UPDATE);
      setValue(`seasons.${range.index}.end`, range.end, DATE_UPDATE);
    }
  };

  const dateField = (edge: (typeof EDGES)[number]) => (
    <MonthDayField
      key={edge}
      control={control}
      name={`seasons.${index}.${edge}`}
      label={t(`season.${edge}`)}
      range={season}
      taken={others}
      isBlocked={day =>
        claimSeasonDays(seasons, index, withEdge(edge, day)) === null
      }
      onPick={day => {
        const range = withEdge(edge, day);
        const shortened = claimSeasonDays(seasons, index, range);
        if (!shortened) return;
        const changes = [{ index, ...range }, ...shortened];
        const previous = changes.map(change => ({
          index: change.index,
          start: seasons[change.index].start,
          end: seasons[change.index].end,
        }));
        writeRanges(changes);
        setUndo(shortened.length > 0 ? { shortened, previous } : null);
      }}
    />
  );

  // Unnamed seasons are told apart by their dates before the change.
  const shortenedLabel = (shortened: ShortenedSeason) => {
    const before = undo?.previous.find(
      range => range.index === shortened.index,
    );
    return (
      getSeasonLabel(seasons[shortened.index] ?? {}) ??
      (before ? formatSeasonRange(before, i18n.language) : '')
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {EDGES.map(dateField)}
      </div>
      {undo && (
        <output
          className="flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-sm"
          data-test="season-shortened"
        >
          <span className="flex-1">
            {undo.shortened
              .map(shortened =>
                t('season.shortened', {
                  name: shortenedLabel(shortened),
                  range: formatSeasonRange(shortened, i18n.language),
                }),
              )
              .join(' ')}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              writeRanges(undo.previous);
              setUndo(null);
            }}
            data-test="undo-shortened"
          >
            {t('season.undo')}
          </Button>
        </output>
      )}
    </div>
  );
}

function SeasonEditor({
  index,
  season,
  baseFrequencyDays,
  onDone,
  onRemove,
}: Readonly<{
  index: number;
  season: Season;
  baseFrequencyDays?: number;
  onDone: () => void;
  onRemove: () => void;
}>) {
  const { t } = useTranslation('common');
  const { control, setValue, getValues } = useFormContext<SeasonFormValues>();
  const active = isDateInSeason(season, new Date());
  const ref = useRef<HTMLLIElement>(null);

  // When opened from the year strip (off-screen), bring the editor into view.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  return (
    <li ref={ref} className="space-y-5 bg-muted/30 p-4" data-test="season-card">
      <div className="flex items-start gap-3">
        <FormField
          control={control}
          name={`seasons.${index}.name`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>{t('season.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('season.namePlaceholder')} {...field} />
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
        {active && (
          <StatusPill tone="success" size="sm" className="mt-7">
            {t('season.activeNow')}
          </StatusPill>
        )}
      </div>

      <SeasonDates index={index} season={season} />

      <div className="space-y-4">
        <ToggleRow
          name={`seasons.${index}.inspectionsPaused`}
          label={t('season.inspections')}
          hint={t('season.inspectionsHint')}
          inverted
          testId="season-inspections"
          onToggle={on => {
            // A paused season has no interval to override.
            if (!on) {
              setValue(`seasons.${index}.inspectionFrequencyDays`, null, {
                shouldDirty: true,
              });
            }
          }}
        >
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
              nullable
            />
          )}
        </ToggleRow>

        <ToggleRow
          name={`seasons.${index}.feeding.enabled`}
          label={t('season.feeding')}
          hint={t('season.feedingHint')}
          testId="season-feeding"
          onToggle={on => {
            if (on && getValues(`seasons.${index}.feeding.targetKg`) == null) {
              setValue(
                `seasons.${index}.feeding.targetKg`,
                DEFAULT_FEEDING_TARGET_KG,
                {
                  shouldDirty: true,
                  shouldValidate: true,
                },
              );
            }
          }}
        >
          {season.feeding.enabled && (
            <NumberField
              control={control}
              name={`seasons.${index}.feeding.targetKg`}
              label={t('season.feedingTarget')}
              placeholder={String(DEFAULT_FEEDING_TARGET_KG)}
              min={0.1}
              step="0.1"
              nullable
            />
          )}
        </ToggleRow>
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          data-test="remove-season"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
          {t('season.remove')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDone}
          data-test="done-season"
        >
          {t('season.done')}
        </Button>
      </div>
    </li>
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
}: Readonly<SeasonListFieldProps>) {
  const { t, i18n } = useTranslation('common');
  const { control } = useFormContext<SeasonFormValues>();
  const editor = useSeasonEditor();
  const seasons = useWatch({ control, name: 'seasons' }) as
    Season[] | undefined;

  // Outside a SeasonsEditorProvider (e.g. a read-only embed) there is nothing
  // to edit.
  if (!editor) return null;

  const { fields, editingId, setEditing, addSeason, removeSeason } = editor;

  const overlap = findOverlappingSeasonPair(seasons ?? []);
  // Unnamed seasons are told apart by their dates.
  const overlapLabel = (index: number) => {
    const season = seasons?.[index];
    if (!season) return '';
    return getSeasonLabel(season) ?? formatSeasonRange(season, i18n.language);
  };
  const overlapping = overlap?.map(index => seasons?.[index]);
  const shared =
    overlapping?.[0] &&
    overlapping[1] &&
    sharedRange(overlapping[0], overlapping[1]);
  // The later season is the one to fix; open it unless it already is.
  const clashing = overlapping?.[1];

  return (
    <div className="space-y-4" data-test="season-list">
      {fields.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          {t('season.empty')}
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {fields.map((field, index) => {
            // `field.id` is the field array's own key, not the season id.
            const seasonId = seasons?.[index]?.id ?? field.id;
            return (
              <SeasonRow
                key={field.id}
                index={index}
                editing={editingId === seasonId}
                baseFrequencyDays={baseFrequencyDays}
                onEdit={() => setEditing(seasonId, true)}
                onDone={() => setEditing(seasonId, false)}
                onRemove={() => removeSeason(seasonId)}
              />
            );
          })}
        </ul>
      )}

      {overlap && (
        <Alert variant="destructive" data-test="season-overlap">
          <AlertCircle className="size-4" />
          <AlertTitle>{t('season.overlapTitle')}</AlertTitle>
          <AlertDescription>
            <p>
              {t('season.overlap', {
                first: overlapLabel(overlap[0]),
                second: overlapLabel(overlap[1]),
                range: shared ? formatSeasonRange(shared, i18n.language) : '',
              })}
            </p>
            {clashing && editingId !== clashing.id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setEditing(clashing.id, true)}
                data-test="edit-overlapping-season"
              >
                {t('season.editSeason', { name: overlapLabel(overlap[1]) })}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() => addSeason()}
        data-test="add-season"
      >
        <Plus className="size-4" />
        {t('season.add')}
      </Button>
    </div>
  );
}
