import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { isDateInSeason, type Season, type SeasonSource } from 'shared-schemas';
import { Badge } from '@/components/ui/badge';
import { formatSeasonRange, getSeasonDisplayName } from '@/utils/season-format';

interface SeasonSummaryRowProps {
  season: Season;
  /** Trailing controls, e.g. edit/remove buttons. */
  children?: ReactNode;
}

/** One season at a glance: name, dates, inspections and feeding. */
export function SeasonSummaryRow({ season, children }: SeasonSummaryRowProps) {
  const { t, i18n } = useTranslation('common');
  const active = isDateInSeason(season, new Date());

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{getSeasonDisplayName(season, t)}</span>
          <span className="text-sm text-muted-foreground">
            {formatSeasonRange(season, i18n.language)}
          </span>
          {active && <Badge variant="secondary">{t('season.activeNow')}</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {season.inspectionsPaused && <span>{t('season.noInspections')}</span>}
          {!season.inspectionsPaused &&
            season.inspectionFrequencyDays != null && (
              <span>
                {t('season.inspectionEvery', {
                  days: season.inspectionFrequencyDays,
                })}
              </span>
            )}
          {season.feeding.enabled && season.feeding.targetKg != null && (
            <span>
              {t('season.feedingTargetValue', {
                amount: season.feeding.targetKg,
              })}
            </span>
          )}
        </div>
      </div>
      {children && <div className="flex shrink-0 gap-1">{children}</div>}
    </div>
  );
}

interface SeasonSummaryListProps {
  seasons: Season[];
  source: SeasonSource;
}

/** Read-only overview of the seasons currently governing a hive. */
export function SeasonSummaryList({ seasons, source }: SeasonSummaryListProps) {
  const { t } = useTranslation('common');
  const sourceKey = `season.source.${source}` as const;

  return (
    <div className="space-y-3" data-test="season-summary">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{t('season.sourceLabel')}</span>
        <Badge variant="secondary">{t(sourceKey)}</Badge>
      </div>

      {seasons.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          {t('season.noneConfigured')}
        </p>
      ) : (
        <ul className="space-y-2">
          {seasons.map(season => (
            <li
              key={season.id}
              className="rounded-lg border p-3"
              data-test="season-summary-row"
            >
              <SeasonSummaryRow season={season} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
