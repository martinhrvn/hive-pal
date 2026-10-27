import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Plus } from 'lucide-react';
import { isDateInSeason, type Season } from 'shared-schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  formatMonthDay,
  formatMonthLabels,
  formatSeasonRange,
  getSeasonDisplayName,
} from '@/utils/season-format';
import {
  STRIP_DAYS,
  buildInspectionTicks,
  buildYearStripSegments,
  seasonRole,
  stripDayIndex,
  stripIndexToMonthDay,
  type InspectionTick,
  type StripRole,
  type YearStripSegment,
} from '@/utils/season-strip';
import { useSeasonEditor } from './season-editor-context';
import { ROLE_TONES } from './season-tone';

/** Segments shorter than this stay unlabelled on the strip. */
const MIN_LABEL_DAYS = 21;

/** Key order: what the beekeeper does, then the days nothing is set for. */
const KEY_ROLES: StripRole[] = ['inspect', 'feeding', 'paused', 'yearRound'];

/** Month boundaries after January, for the gridlines. */
const MONTH_STARTS = Array.from({ length: 11 }, (_, index) =>
  stripDayIndex(index + 2, 1),
);

const percent = (days: number) => `${(days / STRIP_DAYS) * 100}%`;

const segmentRole = (segment: YearStripSegment): StripRole =>
  segment.kind === 'season' ? seasonRole(segment.season) : 'yearRound';

/** How a segment reads while a season is open in the editor. */
type Focus = 'editing' | 'dimmed' | undefined;

interface SeasonYearStripProps {
  seasons: Season[];
  /**
   * Inspection interval on days no season covers. `undefined` when it is not
   * one value (an apiary without a year-round default: each hive uses its own).
   */
  baseFrequencyDays?: number;
  /** Reference date for the "today" marker and the active season. */
  today?: Date;
  className?: string;
}

/**
 * The year as one strip: each season as a segment coloured by what it does,
 * the remaining days as the year-round default, and a tick for every
 * inspection the intervals imply. Inside a `SeasonsEditorProvider` the strip
 * is editable: clicking a season opens its editor, clicking a gap adds a
 * season covering the whole gap (across the new year when it touches both
 * ends), and each season's overflow menu carries edit/delete controls.
 */
export function SeasonYearStrip({
  seasons,
  baseFrequencyDays,
  today = new Date(),
  className,
}: SeasonYearStripProps) {
  const { t, i18n } = useTranslation('common');
  const editingId = useSeasonEditor()?.editingId;
  const segments = useMemo(() => buildYearStripSegments(seasons), [seasons]);
  const ticks = useMemo(
    () => buildInspectionTicks(segments, baseFrequencyDays),
    [segments, baseFrequencyDays],
  );
  // Both halves of a gap across the new year light up together.
  const [hoveredGap, setHoveredGap] = useState<number>();
  const todayIndex = stripDayIndex(today.getMonth() + 1, today.getDate());
  const monthLabels = useMemo(
    () => formatMonthLabels(i18n.language),
    [i18n.language],
  );
  const roles = new Set(segments.map(segmentRole));

  // While a season is open in the editor, it stands out and the rest of the
  // year steps back.
  const focusOf = (seasonId?: string): Focus => {
    if (!editingId) return undefined;
    return seasonId === editingId ? 'editing' : 'dimmed';
  };

  return (
    <div className={cn('space-y-1.5', className)} data-test="season-year-strip">
      <div aria-hidden className="relative h-1.5">
        <span
          className="absolute top-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-foreground"
          style={{ left: percent(todayIndex + 0.5) }}
        />
      </div>
      <div className="relative h-9 overflow-hidden rounded-md border bg-background sm:h-12">
        {segments.map(segment => (
          <StripSegment
            key={`${segment.kind}-${segment.start}`}
            segment={segment}
            focus={focusOf(
              segment.kind === 'season' ? segment.season.id : undefined,
            )}
            baseFrequencyDays={baseFrequencyDays}
            today={today}
            hoveredGap={hoveredGap}
            onHoverGap={setHoveredGap}
          />
        ))}
        <StripRhythm ticks={ticks} focusOf={focusOf} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-foreground"
          style={{ left: percent(todayIndex + 0.5) }}
        />
      </div>
      <div className="relative h-4 text-xs text-muted-foreground">
        {monthLabels.map(({ month, narrow, short }) => (
          <span
            key={month}
            className="absolute"
            style={{ left: percent(stripDayIndex(month, 1)) }}
          >
            <span className="sm:hidden">{narrow}</span>
            <span className="hidden sm:inline">{short}</span>
          </span>
        ))}
      </div>
      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground"
        data-test="strip-key"
      >
        {KEY_ROLES.filter(role => roles.has(role)).map(role => (
          <li key={role} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn('size-3 rounded-[3px]', ROLE_TONES[role].swatch)}
            />
            {t(`season.strip.key.${role}`)}
          </li>
        ))}
        {ticks.length > 0 && (
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="mx-1 h-2.5 w-px bg-muted-foreground/70"
            />
            {t('season.strip.key.tick')}
          </li>
        )}
      </ul>
      <p className="sr-only">
        {t('season.strip.today', {
          date: formatMonthDay(today, i18n.language),
        })}
      </p>
    </div>
  );
}

/**
 * Month gridlines and one tick per implied inspection, drawn over the
 * segments in the lower half of the strip. Purely visual: the segments carry
 * the interval in their popovers.
 */
function StripRhythm({
  ticks,
  focusOf,
}: {
  ticks: InspectionTick[];
  focusOf: (seasonId?: string) => Focus;
}) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 size-full"
      viewBox={`0 0 ${STRIP_DAYS} 100`}
      preserveAspectRatio="none"
    >
      {MONTH_STARTS.map(index => (
        <line
          key={index}
          x1={index}
          x2={index}
          y1={0}
          y2={100}
          className="stroke-foreground/10"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {ticks.map(tick => (
        <line
          key={`${tick.seasonId ?? 'year-round'}-${tick.index}`}
          x1={tick.index + 0.5}
          x2={tick.index + 0.5}
          y1={66}
          y2={84}
          strokeWidth={1.25}
          strokeLinecap="round"
          className={cn(
            ROLE_TONES[tick.role].tick,
            focusOf(tick.seasonId) === 'dimmed' && 'opacity-40',
          )}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

const segmentClasses = (role: StripRole, focus: Focus, last: boolean) =>
  cn(
    'flex items-start px-1.5 pt-1.5 text-left text-xs font-medium text-foreground/80 transition-[filter,opacity]',
    ROLE_TONES[role].segment,
    !last && 'border-r border-background',
    'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
    focus === 'editing' && 'ring-2 ring-inset ring-foreground/70',
    focus === 'dimmed' && 'opacity-50',
  );

function StripSegment({
  segment,
  focus,
  baseFrequencyDays,
  today,
  hoveredGap,
  onHoverGap,
}: {
  segment: YearStripSegment;
  focus: Focus;
  baseFrequencyDays?: number;
  today: Date;
  /** `gapStart` of the year-round gap under the pointer. */
  hoveredGap?: number;
  onHoverGap: (gapStart: number | undefined) => void;
}) {
  const editor = useSeasonEditor();
  const { t } = useTranslation('common');
  const isSeason = segment.kind === 'season';
  const role = segmentRole(segment);
  const last = segment.end >= STRIP_DAYS - 1;
  const label = isSeason
    ? getSeasonDisplayName(segment.season, t)
    : t('season.strip.yearRound');
  // Short segments would only show an ellipsis; the popover still names them.
  const showLabel = segment.end - segment.start + 1 >= MIN_LABEL_DAYS;
  const segmentStyle = {
    left: percent(segment.start),
    width: percent(segment.end - segment.start + 1),
  };
  const labelNode = showLabel && (
    <span className="hidden min-w-0 truncate sm:inline">{label}</span>
  );

  // Editable season segment: click opens the editor; the ⋯ menu (summary +
  // edit/delete) sits on its right edge.
  if (editor && isSeason) {
    return (
      <div className="group absolute inset-y-0" style={segmentStyle}>
        <button
          type="button"
          aria-label={label}
          data-test="strip-season"
          onClick={() => editor.setEditing(segment.season.id, true)}
          className={cn(
            'absolute inset-0 hover:brightness-95 dark:hover:brightness-125',
            segmentClasses(role, focus, last),
          )}
        >
          {labelNode}
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('season.strip.more')}
              data-test="strip-season-more"
              className="absolute right-0.5 top-1 z-30 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-background/60 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-3 text-sm">
            <SeasonSummary
              season={segment.season}
              baseFrequencyDays={baseFrequencyDays}
              today={today}
            />
            <div className="flex justify-end gap-2 border-t pt-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor.setEditing(segment.season.id, true)}
              >
                {t('season.edit')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => editor.removeSeason(segment.season.id)}
              >
                {t('season.remove')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Editable year-round gap: click to add a season covering the whole gap,
  // so Jan – Mar and Oct – Dec around the new year become one season.
  if (editor && !isSeason) {
    const start = stripIndexToMonthDay(segment.gapStart);
    const end = stripIndexToMonthDay(segment.gapEnd);
    return (
      <button
        type="button"
        aria-label={t('season.strip.addSeason')}
        data-test="strip-year-round"
        onClick={() => editor.addSeason(start, end)}
        onPointerEnter={() => onHoverGap(segment.gapStart)}
        onPointerLeave={() => onHoverGap(undefined)}
        className={cn(
          'group/round absolute inset-y-0',
          segmentClasses(role, focus, last),
          'font-normal text-muted-foreground hover:bg-muted',
          hoveredGap === segment.gapStart && 'bg-muted',
        )}
        style={segmentStyle}
      >
        <span className="hidden min-w-0 truncate opacity-0 transition-opacity group-hover/round:opacity-100 sm:inline">
          <Plus className="mr-0.5 inline size-3" />
          {t('season.strip.addSeason')}
        </span>
      </button>
    );
  }

  // Read-only: click opens a summary popover.
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          data-test={isSeason ? 'strip-season' : 'strip-year-round'}
          className={cn(
            'absolute inset-y-0 hover:brightness-95 dark:hover:brightness-125',
            segmentClasses(role, focus, last),
            !isSeason && 'font-normal text-muted-foreground',
          )}
          style={segmentStyle}
        >
          {labelNode}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-2 text-sm">
        {segment.kind === 'season' ? (
          <SeasonSummary
            season={segment.season}
            baseFrequencyDays={baseFrequencyDays}
            today={today}
          />
        ) : (
          <YearRoundSummary baseFrequencyDays={baseFrequencyDays} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function SeasonSummary({
  season,
  baseFrequencyDays,
  today,
}: {
  season: Season;
  baseFrequencyDays?: number;
  today: Date;
}) {
  const { t, i18n } = useTranslation('common');
  const interval = season.inspectionFrequencyDays ?? baseFrequencyDays;
  const feedingTarget = season.feeding.enabled
    ? season.feeding.targetKg
    : undefined;

  return (
    <div className="space-y-2" data-test="strip-popover">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            'size-3 shrink-0 rounded-[3px]',
            ROLE_TONES[seasonRole(season)].swatch,
          )}
        />
        <span className="font-medium">{getSeasonDisplayName(season, t)}</span>
        {isDateInSeason(season, today) && (
          <Badge variant="secondary">{t('season.activeNow')}</Badge>
        )}
      </div>
      <p className="text-muted-foreground tabular-nums">
        {formatSeasonRange(season, i18n.language)}
      </p>
      <ul className="space-y-1">
        {season.inspectionsPaused ? (
          <li>{t('season.noInspections')}</li>
        ) : (
          <li>
            {interval == null
              ? t('season.strip.hiveInterval')
              : t('season.inspectionEvery', { days: interval })}
            {season.inspectionFrequencyDays == null && interval != null && (
              <span className="text-muted-foreground">
                {' '}
                {t('season.strip.fromYearRound')}
              </span>
            )}
          </li>
        )}
        {feedingTarget != null && (
          <li>{t('season.feedingTargetValue', { amount: feedingTarget })}</li>
        )}
      </ul>
    </div>
  );
}

function YearRoundSummary({
  baseFrequencyDays,
}: {
  baseFrequencyDays?: number;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-2" data-test="strip-popover">
      <p className="font-medium">{t('season.strip.yearRound')}</p>
      <p className="text-muted-foreground">{t('season.strip.yearRoundHint')}</p>
      <p>
        {baseFrequencyDays == null
          ? t('season.strip.hiveInterval')
          : t('season.inspectionEvery', { days: baseFrequencyDays })}
      </p>
    </div>
  );
}
