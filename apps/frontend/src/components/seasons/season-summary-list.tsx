import { useTranslation } from 'react-i18next';
import { isDateInSeason, type Season } from 'shared-schemas';
import { StatusPill } from '@/components/common/status-pill';
import { formatSeasonRange, getSeasonDisplayName } from '@/utils/season-format';
import { seasonRole } from '@/utils/season-strip';
import { SeasonSwatch } from './season-swatch';

interface SeasonSummaryRowProps {
  season: Season;
  /** Interval on days without an override, shown for seasons that inherit it. */
  baseFrequencyDays?: number;
}

/**
 * One season at a glance: its strip colour, name, dates, inspections and
 * feeding. Built from inline elements so it can sit inside a button.
 */
export function SeasonSummaryRow({
  season,
  baseFrequencyDays,
}: Readonly<SeasonSummaryRowProps>) {
  const { t, i18n } = useTranslation('common');
  const active = isDateInSeason(season, new Date());
  const interval = season.inspectionFrequencyDays ?? baseFrequencyDays;

  return (
    <span className="flex min-w-0 items-start gap-3">
      <SeasonSwatch role={seasonRole(season)} className="mt-1" />
      <span className="block min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">{getSeasonDisplayName(season, t)}</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatSeasonRange(season, i18n.language)}
          </span>
          {active && (
            <StatusPill tone="success" size="sm">
              {t('season.activeNow')}
            </StatusPill>
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
          {season.inspectionsPaused && <span>{t('season.noInspections')}</span>}
          {!season.inspectionsPaused && interval != null && (
            <span>{t('season.inspectionEvery', { days: interval })}</span>
          )}
          {season.feeding.enabled && season.feeding.targetKg != null && (
            <span>
              {t('season.feedingTargetValue', {
                amount: season.feeding.targetKg,
              })}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}

interface SeasonSummaryListProps {
  seasons: Season[];
  /** Interval on days without an override, shown for seasons that inherit it. */
  baseFrequencyDays?: number;
}

/**
 * Read-only overview of the seasons currently governing a hive. The caller
 * says where they come from.
 */
export function SeasonSummaryList({
  seasons,
  baseFrequencyDays,
}: Readonly<SeasonSummaryListProps>) {
  const { t } = useTranslation('common');

  return (
    <div data-test="season-summary">
      {seasons.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          {t('season.noneConfigured')}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {seasons.map(season => (
            <li
              key={season.id}
              className="px-3 py-2.5"
              data-test="season-summary-row"
            >
              <SeasonSummaryRow
                season={season}
                baseFrequencyDays={baseFrequencyDays}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
