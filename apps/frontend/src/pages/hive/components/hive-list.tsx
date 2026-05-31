import { Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { TrendIndicator } from '@/components/common/trend-indicator';
import { Link } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { HiveResponse } from 'shared-schemas';
import { AlertsPopover } from '@/components/alerts';
import { useHive } from '@/api/hooks/useHives';
import { useActions } from '@/api/hooks/useActions';
import {
  calculateFeedingTotals,
  isWithinFeedingWindow,
} from '@/utils/feeding-calculations';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildBoxGradient } from '@/utils/box-gradient';
import { useImageDisplayStore } from '@/stores/image-display-store';
import { useApiary } from '@/hooks/use-apiary';
import { WARNING_LABELS } from '@/utils/warning-labels';
import { cn } from '@/lib/utils';

type HiveListProps = {
  hives: HiveResponse[];
};

type HiveStatusEnum = HiveResponse['status'];

const statusTone: Record<
  HiveStatusEnum,
  { dot: string; label: string; text: string }
> = {
  ACTIVE: {
    dot: 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]',
    label: 'Active',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  INACTIVE: {
    dot: 'bg-stone-400 shadow-[0_0_0_3px_rgba(120,113,108,0.15)]',
    label: 'Inactive',
    text: 'text-stone-600 dark:text-stone-400',
  },
  DEAD: {
    dot: 'bg-stone-700',
    label: 'Dead',
    text: 'text-stone-700 dark:text-stone-300',
  },
  UNKNOWN: {
    dot: 'bg-stone-300',
    label: 'Unknown',
    text: 'text-stone-500 dark:text-stone-400',
  },
  SOLD: {
    dot: 'bg-stone-400',
    label: 'Sold',
    text: 'text-stone-600 dark:text-stone-400',
  },
  ARCHIVED: {
    dot: 'bg-stone-400',
    label: 'Archived',
    text: 'text-stone-600 dark:text-stone-400',
  },
};

const StatusIndicator: React.FC<{ status?: HiveStatusEnum }> = ({ status }) => {
  if (!status) return null;
  const tone = statusTone[status] ?? statusTone.UNKNOWN;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-overline whitespace-nowrap',
        tone.text,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
      {tone.label}
    </span>
  );
};

const relativeDate = (dateString?: string, t?: (k: string) => string) => {
  if (!dateString) return t ? t('hive:card.noInspection') : 'Not inspected';
  const date = new Date(dateString);
  const days = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) return 'Inspected today';
  if (days === 1) return 'Inspected yesterday';
  if (days < 30) return `Inspected ${days} days ago`;
  if (days < 60) return 'Inspected last month';
  return `Inspected ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const HiveCard: React.FC<{ hive: HiveResponse; isSubjective: boolean }> = ({
  hive,
  isSubjective,
}) => {
  const { t } = useTranslation(['hive']);
  const { data: hiveDetails } = useHive(hive.id, { staleTime: 5 * 60 * 1000 });
  const { data: actions } = useActions(
    { hiveId: hive.id },
    {
      staleTime: 5 * 60 * 1000,
      enabled: isWithinFeedingWindow(hiveDetails?.settings),
    },
  );

  const feedingInfo = useMemo(() => {
    if (!actions) return null;
    const settings = hiveDetails?.settings || undefined;
    if (!isWithinFeedingWindow(settings)) return null;
    const totals = calculateFeedingTotals(actions, settings);
    const optimalAmount = settings?.autumnFeeding?.amountKg ?? 12;
    return {
      fed: totals.autumnSugarKg,
      optimal: optimalAmount,
      percentage: Math.round((totals.autumnSugarKg / optimalAmount) * 100),
    };
  }, [actions, hiveDetails?.settings]);

  const featurePhotoUrl = hive.featurePhotoUrl || hiveDetails?.featurePhotoUrl;
  const { mode: imageMode } = useImageDisplayStore();
  // Side image only when the card container has room (@md = 28rem = 448px).
  const allowSide = imageMode === 'side';

  const currentStrength = hive.lastInspectionStrength;
  const totalFrames = hive.lastInspectionTotalFrames;
  const strengthDelta =
    currentStrength != null && hive.previousInspectionStrength != null
      ? currentStrength - hive.previousInspectionStrength
      : null;

  const inspectionLabel = useMemo(
    () => relativeDate(hive.lastInspectionDate, t),
    [hive.lastInspectionDate, t],
  );

  const hasFeedingInfo = feedingInfo !== null;
  const hasStrength = !isSubjective && currentStrength != null;
  const hasOverallScore = isSubjective && hive.lastInspectionOverallScore != null;
  const hasWarnings = hive.lastInspectionWarnings.length > 0;
  const hasAlerts = (hive.alerts?.length ?? 0) > 0;

  const imageSizeClasses = allowSide
    ? 'w-full @md/hivecard:w-[160px] @lg/hivecard:w-[180px] flex-shrink-0 h-32 @sm/hivecard:h-36 @md/hivecard:h-auto @md/hivecard:min-h-[200px]'
    : 'w-full h-32 @sm/hivecard:h-36';

  const imageElement =
    imageMode !== 'hidden' ? (
      featurePhotoUrl ? (
        <div
          className={cn(
            'relative overflow-hidden bg-stone-100 dark:bg-stone-900',
            imageSizeClasses,
          )}
        >
          <img
            src={featurePhotoUrl}
            alt={`${hive.name} feature photo`}
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
      ) : (
        <div
          className={cn('relative overflow-hidden', imageSizeClasses)}
          style={{ background: buildBoxGradient(hiveDetails?.boxes) }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
        </div>
      )
    ) : null;

  return (
    <div className="@container/hivecard">
    <Link
      to={`/hives/${hive.id}`}
      className={cn(
        'group/hivecard relative rounded-xl border border-stone-200 dark:border-stone-800 bg-card overflow-hidden block',
        'shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_22px_-14px_rgba(120,80,20,0.10)]',
        'transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_2px_6px_rgba(0,0,0,0.04),0_16px_32px_-16px_rgba(180,120,40,0.18)]',
        'flex flex-col',
        allowSide && '@md/hivecard:flex-row',
      )}
    >
      {imageElement}

      <div className="flex-1 min-w-0 flex flex-col px-4 @sm/hivecard:px-5 py-4">
        {/* Overline row: inspection time + status */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <span className="font-overline text-stone-500 dark:text-stone-400 truncate">
            {inspectionLabel}
          </span>
          <StatusIndicator status={hive.status} />
        </div>

        {/* Name */}
        <h3 className="mt-1 font-display text-xl @sm/hivecard:text-2xl @lg/hivecard:text-[1.6rem] font-medium leading-tight text-stone-900 dark:text-stone-50 truncate">
          {hive.name}
        </h3>

        {/* Hero metrics row */}
        {(hasStrength || hasOverallScore || hasFeedingInfo) && (
          <div className="mt-3 flex flex-wrap items-stretch gap-y-2 @sm/hivecard:divide-x @sm/hivecard:divide-stone-200 @sm/hivecard:dark:divide-stone-800 -mx-1">
            {hasStrength && (
              <div className="px-2 @sm/hivecard:px-3 first:pl-1">
                <div className="font-display text-xl @sm/hivecard:text-2xl tabular-nums text-stone-900 dark:text-stone-50 leading-none flex items-baseline gap-1">
                  <span>{currentStrength}</span>
                  {totalFrames != null && (
                    <span className="text-sm font-normal text-stone-400">
                      / {totalFrames}
                    </span>
                  )}
                  {strengthDelta !== null && (
                    <span className="ml-1 inline-flex items-center">
                      <TrendIndicator
                        delta={strengthDelta}
                        iconSize="h-3.5 w-3.5"
                      />
                    </span>
                  )}
                </div>
                <div className="mt-1 font-overline text-stone-500 dark:text-stone-400">
                  {t('hive:card.strength')}
                </div>
              </div>
            )}
            {hasOverallScore && (
              <div className="px-2 @sm/hivecard:px-3 first:pl-1">
                <div className="font-display text-xl @sm/hivecard:text-2xl tabular-nums text-amber-700 dark:text-amber-400 leading-none">
                  {hive.lastInspectionOverallScore!.toFixed(1)}
                  <span className="text-sm font-normal text-stone-400 ml-1">
                    / 10
                  </span>
                </div>
                <div className="mt-1 font-overline text-stone-500 dark:text-stone-400">
                  {t('hive:card.score')}
                </div>
              </div>
            )}
            {hasFeedingInfo && feedingInfo && (
              <div className="px-2 @sm/hivecard:px-3 first:pl-1">
                <div className="font-display text-xl @sm/hivecard:text-2xl tabular-nums text-emerald-700 dark:text-emerald-400 leading-none flex items-baseline gap-1">
                  <Activity className="h-4 w-4 -mb-0.5 text-emerald-600/80" />
                  <span>{feedingInfo.fed.toFixed(1)}</span>
                  <span className="text-sm font-normal text-stone-400">
                    / {feedingInfo.optimal}kg
                  </span>
                </div>
                <div className="mt-1 font-overline text-stone-500 dark:text-stone-400">
                  feeding · {feedingInfo.percentage}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes — only if present, as a discreet pull-quote */}
        {hive.notes && (
          <p className="mt-3 text-sm italic text-stone-500 dark:text-stone-400 line-clamp-2 leading-snug border-l-2 border-amber-500/40 pl-3">
            {hive.notes}
          </p>
        )}

        {/* Footer row: warnings / alerts on the left, view link on the right */}
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2 border-t border-stone-200 dark:border-stone-800 pt-3">
            <div
              className="flex items-center gap-3 flex-1 min-w-0"
              onClick={e => e.preventDefault()}
            >
              {hasWarnings && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      onClick={e => e.preventDefault()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-900 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
                      aria-label="Inspection warnings"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="tabular-nums">
                        {hive.lastInspectionWarnings.length}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-1.5 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
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
              {hasAlerts && (
                <div onClick={e => e.preventDefault()}>
                  <AlertsPopover alerts={hive.alerts || []} />
                </div>
              )}
              {!hasWarnings && !hasAlerts && (
                <span className="text-xs text-stone-400 dark:text-stone-500 italic">
                  {hive.notes
                    ? ''
                    : t('hive:fields.noNotes')}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-stone-700 dark:text-stone-300 group-hover/hivecard:text-amber-700 dark:group-hover/hivecard:text-amber-400 transition-colors">
              {t('hive:card.showDetails', 'Show details')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/hivecard:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
    </div>
  );
};

export const HiveList: React.FC<HiveListProps> = ({ hives }) => {
  const { activeApiary } = useApiary();
  const isSubjective =
    activeApiary?.settings?.inspectionType === 'subjective';

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hives.map(hive => (
          <HiveCard key={hive.id} hive={hive} isSubjective={isSubjective} />
        ))}
      </div>
    </div>
  );
};
