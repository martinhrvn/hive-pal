import { Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { TrendIndicator } from '@/components/common/trend-indicator';
import { Link } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { HiveResponse } from 'shared-schemas';
import { AlertsPopover } from '@/components/alerts/alerts-popover';
import { Metric } from '@/components/common/metric';
import { StatusPill } from '@/components/common/status-pill';
import { useActions } from '@/api/hooks/useActions';
import {
  calculateFeedingTotals,
  isWithinFeedingWindow,
} from '@/utils/feeding-calculations';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { buildBoxGradient } from '@/utils/box-gradient';
import {
  useImageDisplayStore,
  type ImageDisplayMode,
} from '@/stores/image-display-store';
import { WARNING_LABELS } from '@/utils/warning-labels';
import {
  STATUS_DOT_CLASS,
  STATUS_TEXT_CLASS,
  getStatusTone,
  hiveStatusLabelKey,
} from '@/utils/status-colors';
import { cn } from '@/lib/utils';

const DAY_MS = 1000 * 60 * 60 * 24;

type HiveListProps = {
  hives: HiveResponse[];
  /** Apiaries using subjective inspections show the overall score instead of strength. */
  isSubjective: boolean;
};

const StatusIndicator: React.FC<{ status?: HiveResponse['status'] }> = ({
  status,
}) => {
  const { t } = useTranslation('hive');
  if (!status) return null;
  const tone = getStatusTone(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-overline whitespace-nowrap',
        STATUS_TEXT_CLASS[tone],
      )}
    >
      <span className={cn('size-1.5 rounded-full', STATUS_DOT_CLASS[tone])} />
      {t(hiveStatusLabelKey(status))}
    </span>
  );
};

const inspectionLabel = (
  t: TFunction,
  language: string,
  dateString?: string,
) => {
  if (!dateString) return t('hive:card.noInspection');
  const date = new Date(dateString);
  const days = Math.floor((Date.now() - date.getTime()) / DAY_MS);
  const when =
    days < 30
      ? new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(
          -days,
          'day',
        )
      : date.toLocaleDateString(language, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  return t('hive:card.inspectedWhen', { when });
};

const HiveCard: React.FC<{
  hive: HiveResponse;
  isSubjective: boolean;
  imageMode: ImageDisplayMode;
}> = ({ hive, isSubjective, imageMode }) => {
  const { t, i18n } = useTranslation(['hive', 'common']);
  // The list response already carries settings, so no per-hive detail fetch.
  const settings = hive.settings ?? undefined;
  const inFeedingWindow = isWithinFeedingWindow(settings);
  const { data: actions } = useActions(
    { hiveId: hive.id },
    { staleTime: 5 * 60 * 1000, enabled: inFeedingWindow },
  );

  const feedingInfo = useMemo(() => {
    if (!actions || !inFeedingWindow) return null;
    const totals = calculateFeedingTotals(actions, settings);
    const optimalAmount = settings?.autumnFeeding?.amountKg ?? 12;
    return {
      fed: totals.autumnSugarKg,
      optimal: optimalAmount,
      percentage: Math.round((totals.autumnSugarKg / optimalAmount) * 100),
    };
  }, [actions, inFeedingWindow, settings]);

  // Side image only when the card container has room (@md = 28rem = 448px).
  const allowSide = imageMode === 'side';

  const currentStrength = hive.lastInspectionStrength;
  const totalFrames = hive.lastInspectionTotalFrames;
  const strengthDelta =
    currentStrength != null && hive.previousInspectionStrength != null
      ? currentStrength - hive.previousInspectionStrength
      : null;
  const overallScore = hive.lastInspectionOverallScore;

  const hasStrength = !isSubjective && currentStrength != null;
  const hasOverallScore = isSubjective && overallScore != null;
  const hasWarnings = hive.lastInspectionWarnings.length > 0;
  const hasAlerts = (hive.alerts?.length ?? 0) > 0;

  const imageSizeClasses = allowSide
    ? 'w-full @md/hivecard:w-[160px] @lg/hivecard:w-[180px] flex-shrink-0 h-32 @sm/hivecard:h-36 @md/hivecard:h-auto @md/hivecard:min-h-[200px]'
    : 'w-full h-32 @sm/hivecard:h-36';

  let imageElement: React.ReactNode = null;
  if (imageMode !== 'hidden' && hive.featurePhotoUrl) {
    imageElement = (
      <div
        className={cn('relative overflow-hidden bg-muted', imageSizeClasses)}
      >
        <img
          src={hive.featurePhotoUrl}
          alt={t('common:photo.featureAlt', {
            name: hive.name,
            defaultValue: '{{name}} photo',
          })}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[700ms] ease-out group-hover/hivecard:scale-[1.03]"
        />
        <div
          className={cn(
            'absolute inset-0 pointer-events-none',
            allowSide
              ? '@md/hivecard:bg-gradient-to-r @md/hivecard:from-transparent @md/hivecard:to-card/15 bg-gradient-to-t from-card/30 via-transparent to-transparent'
              : 'bg-gradient-to-t from-card/30 via-transparent to-transparent',
          )}
        />
      </div>
    );
  } else if (imageMode !== 'hidden') {
    imageElement = (
      <div
        className={cn('relative overflow-hidden', imageSizeClasses)}
        style={{ background: buildBoxGradient(hive.boxes) }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="@container/hivecard">
      {/* Stretched-link card: the name link covers the card via ::after, and
          the popover triggers sit above it (relative z-10), so no interactive
          element is nested inside the link. */}
      <Card
        className={cn(
          'group/hivecard relative h-full gap-0 overflow-hidden py-0',
          'shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_22px_-14px_rgba(120,80,20,0.10)]',
          'transition-all duration-300 hover:border-honey/40 hover:shadow-[0_2px_6px_rgba(0,0,0,0.04),0_16px_32px_-16px_rgba(180,120,40,0.18)]',
          'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:active]:scale-[0.99]',
          allowSide && '@md/hivecard:flex-row',
        )}
      >
        {imageElement}

        <div className="flex-1 min-w-0 flex flex-col px-4 @sm/hivecard:px-5 py-4">
          {/* Overline row: inspection time + status */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <span className="font-overline text-muted-foreground truncate">
              {inspectionLabel(t, i18n.language, hive.lastInspectionDate)}
            </span>
            <StatusIndicator status={hive.status} />
          </div>

          <h3 className="mt-1 font-display text-xl @sm/hivecard:text-2xl @lg/hivecard:text-[1.6rem] font-medium leading-tight text-foreground truncate">
            <Link
              to={`/hives/${hive.id}`}
              className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
            >
              {hive.name}
            </Link>
          </h3>

          {/* Hero metrics row */}
          {(hasStrength || hasOverallScore || feedingInfo) && (
            <div className="mt-3 flex flex-wrap items-stretch gap-y-2 @sm/hivecard:divide-x -mx-1">
              {hasStrength && (
                <Metric
                  className="px-2 @sm/hivecard:px-3 first:pl-1"
                  label={t('hive:card.strength')}
                  value={currentStrength}
                  unit={totalFrames != null ? `/ ${totalFrames}` : undefined}
                  adornment={
                    strengthDelta !== null && (
                      <span className="ml-1 inline-flex items-center">
                        <TrendIndicator
                          delta={strengthDelta}
                          iconClassName="size-3.5"
                        />
                      </span>
                    )
                  }
                />
              )}
              {hasOverallScore && (
                <Metric
                  className="px-2 @sm/hivecard:px-3 first:pl-1"
                  label={t('hive:card.score')}
                  value={overallScore.toFixed(1)}
                  unit="/ 10"
                  tone="honey"
                />
              )}
              {feedingInfo && (
                <Metric
                  className="px-2 @sm/hivecard:px-3 first:pl-1"
                  label={t('hive:card.feedingProgress', {
                    percent: feedingInfo.percentage,
                  })}
                  value={feedingInfo.fed.toFixed(1)}
                  unit={`/ ${feedingInfo.optimal} kg`}
                  tone="success"
                  icon={<Activity className="size-4 -mb-0.5 opacity-80" />}
                />
              )}
            </div>
          )}

          {/* Notes — only if present, as a discreet pull-quote */}
          {hive.notes && (
            <p className="mt-3 text-sm italic text-muted-foreground line-clamp-2 leading-snug border-l-2 border-honey/40 pl-3">
              {hive.notes}
            </p>
          )}

          {/* Footer row: warnings / alerts on the left, view hint on the right */}
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
                {hasWarnings && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <StatusPill tone="warning" size="sm" asChild>
                        <button
                          type="button"
                          aria-label={t('hive:card.inspectionWarnings')}
                        >
                          <AlertTriangle />
                          <span className="tabular-nums">
                            {hive.lastInspectionWarnings.length}
                          </span>
                        </button>
                      </StatusPill>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-1.5 text-warning-foreground">
                          <AlertTriangle className="size-4" />
                          {t('hive:card.inspectionWarnings')}
                        </h4>
                        <ul className="space-y-1">
                          {hive.lastInspectionWarnings.map(w => (
                            <li
                              key={w}
                              className="text-sm text-muted-foreground"
                            >
                              {WARNING_LABELS[w] ?? w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {hasAlerts && <AlertsPopover alerts={hive.alerts ?? []} />}
                {!hasWarnings && !hasAlerts && !hive.notes && (
                  <span className="text-xs text-muted-foreground italic">
                    {t('hive:fields.noNotes')}
                  </span>
                )}
              </div>
              <span
                aria-hidden="true"
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 group-hover/hivecard:text-honey-foreground transition-colors"
              >
                {t('hive:card.showDetails', 'Show details')}
                <ArrowRight className="size-3.5 transition-transform group-hover/hivecard:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const HiveList: React.FC<HiveListProps> = ({ hives, isSubjective }) => {
  // Read once here rather than subscribing every card to the store.
  const imageMode = useImageDisplayStore(state => state.mode);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {hives.map(hive => (
        <HiveCard
          key={hive.id}
          hive={hive}
          isSubjective={isSubjective}
          imageMode={imageMode}
        />
      ))}
    </div>
  );
};
