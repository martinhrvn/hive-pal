import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isDateInSeason, type Season } from 'shared-schemas';
import { Badge } from '@/components/ui/badge';
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
  buildYearStripSegments,
  stripDayIndex,
  type YearStripSegment,
} from '@/utils/season-strip';

/** One tone per season position, cycling through the chart palette. */
const SEASON_TONES = [
  { segment: 'bg-chart-1/30 hover:bg-chart-1/45', swatch: 'bg-chart-1' },
  { segment: 'bg-chart-2/30 hover:bg-chart-2/45', swatch: 'bg-chart-2' },
  { segment: 'bg-chart-3/30 hover:bg-chart-3/45', swatch: 'bg-chart-3' },
  { segment: 'bg-chart-4/30 hover:bg-chart-4/45', swatch: 'bg-chart-4' },
  { segment: 'bg-chart-5/30 hover:bg-chart-5/45', swatch: 'bg-chart-5' },
];

const seasonTone = (index: number) => SEASON_TONES[index % SEASON_TONES.length];

/** Segments shorter than this stay unlabelled on the strip. */
const MIN_LABEL_DAYS = 21;

const percent = (days: number) => `${(days / STRIP_DAYS) * 100}%`;

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
 * The year as one strip: each season as a segment, the remaining days as the
 * year-round default. Every segment opens a popover summarising it.
 */
export function SeasonYearStrip({
  seasons,
  baseFrequencyDays,
  today = new Date(),
  className,
}: SeasonYearStripProps) {
  const { t, i18n } = useTranslation('common');
  const segments = useMemo(() => buildYearStripSegments(seasons), [seasons]);
  const todayIndex = stripDayIndex(today.getMonth() + 1, today.getDate());
  const monthLabels = useMemo(
    () => formatMonthLabels(i18n.language),
    [i18n.language],
  );

  return (
    <div className={cn('space-y-1', className)} data-test="season-year-strip">
      <div className="relative h-9 overflow-hidden rounded-md border bg-muted/40">
        {segments.map(segment => (
          <StripSegment
            key={`${segment.kind}-${segment.start}`}
            segment={segment}
            baseFrequencyDays={baseFrequencyDays}
            today={today}
          />
        ))}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-foreground"
          style={{ left: percent(todayIndex) }}
        />
      </div>
      <div className="relative h-4 text-[0.65rem] text-muted-foreground">
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
      {seasons.length > 0 && (
        // Phones have no room for labels on the strip itself.
        <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs sm:hidden">
          {seasons.map((season, index) => (
            <li key={season.id} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn('size-2 rounded-full', seasonTone(index).swatch)}
              />
              {getSeasonDisplayName(season, t)}
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only">
        {t('season.strip.today', {
          date: formatMonthDay(today, i18n.language),
        })}
      </p>
    </div>
  );
}

function StripSegment({
  segment,
  baseFrequencyDays,
  today,
}: {
  segment: YearStripSegment;
  baseFrequencyDays?: number;
  today: Date;
}) {
  const { t } = useTranslation('common');
  const isSeason = segment.kind === 'season';
  const tone = isSeason ? seasonTone(segment.seasonIndex) : undefined;
  const label = isSeason
    ? getSeasonDisplayName(segment.season, t)
    : t('season.strip.yearRound');
  // Short segments would only show an ellipsis; the popover still names them.
  const showLabel = segment.end - segment.start + 1 >= MIN_LABEL_DAYS;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          data-test={isSeason ? 'strip-season' : 'strip-year-round'}
          className={cn(
            'absolute inset-y-0 truncate px-1.5 text-left text-xs font-medium transition-colors',
            segment.end < STRIP_DAYS - 1 && 'border-r border-background',
            'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            tone ? tone.segment : 'text-muted-foreground hover:bg-muted',
          )}
          style={{
            left: percent(segment.start),
            width: percent(segment.end - segment.start + 1),
          }}
        >
          {showLabel && <span className="hidden sm:inline">{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-2 text-sm">
        {segment.kind === 'season' ? (
          <SeasonSummary
            season={segment.season}
            swatch={tone?.swatch}
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
  swatch,
  baseFrequencyDays,
  today,
}: {
  season: Season;
  swatch?: string;
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
          className={cn('size-2.5 shrink-0 rounded-full', swatch)}
        />
        <span className="font-medium">{getSeasonDisplayName(season, t)}</span>
        {isDateInSeason(season, today) && (
          <Badge variant="secondary">{t('season.activeNow')}</Badge>
        )}
      </div>
      <p className="text-muted-foreground">
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
