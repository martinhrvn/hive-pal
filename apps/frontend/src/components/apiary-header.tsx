import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  FileBarChart,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { Metric, type MetricTone } from '@/components/common/metric';
import { StatusPill } from '@/components/common/status-pill';
import { useApiaryStore } from '@/hooks/use-apiary';
import { useApiaryStatistics } from '@/api/hooks/useReports';
import { useApiary, useHives } from '@/api/hooks';
import { useImageDisplayStore } from '@/stores/image-display-store';
import {
  useOverdueInspections,
  useDueTodayInspections,
  useUpcomingInspections,
} from '@/api/hooks/useInspections';
import { useScheduledInspectionActions } from '@/api/hooks/useScheduledInspectionActions';
import { UpcomingInspectionListItem } from '@/components/upcoming-inspection-list-item';
import { cn } from '@/lib/utils';
import { FeaturePhoto } from '@/components/common/feature-photo';
import { ScoreLevelCue } from '@/components/common/score-level-cue';
import { getScoreLevel, type ScoreLevel } from '@/lib/score-level';

const SCORE_TONES: Record<ScoreLevel, MetricTone> = {
  good: 'scoreGood',
  fair: 'scoreFair',
  poor: 'scorePoor',
};

const getScoreTone = (value: number | null | undefined): MetricTone => {
  const level = getScoreLevel(value);
  return level ? SCORE_TONES[level] : 'muted';
};

const ActionLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => (
  <Link
    to={to}
    aria-label={label}
    className="group inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-2 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm transition-all hover:border-honey/70 hover:text-foreground hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] @sm/header:px-3 [&_svg]:size-3.5"
  >
    <span className="text-muted-foreground transition-colors group-hover:text-honey-foreground">
      {icon}
    </span>
    <span className="hidden @xl/header:inline">{label}</span>
  </Link>
);

const HeaderSkeleton = () => (
  <div className="overflow-hidden rounded-xl border bg-card">
    <div className="space-y-4 p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-56" />
      <MetricsSkeleton />
    </div>
  </div>
);

const MetricsSkeleton = () => (
  <div className="grid grid-cols-3 gap-4 pt-2">
    <Skeleton className="h-14 w-full" />
    <Skeleton className="h-14 w-full" />
    <Skeleton className="h-14 w-full" />
  </div>
);

export const ApiaryHeader: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'inspection']);
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  const { data: statistics, isLoading: statsLoading } = useApiaryStatistics(
    activeApiaryId ?? undefined,
    'ytd',
  );
  const { data: apiary, isLoading: apiaryLoading } = useApiary(
    activeApiaryId ?? '',
    { enabled: !!activeApiaryId },
  );
  const { data: hives } = useHives();

  const imageMode = useImageDisplayStore(state => state.mode);

  const { data: overdueInspections, isLoading: overdueLoading } =
    useOverdueInspections();
  const { data: dueTodayInspections, isLoading: dueTodayLoading } =
    useDueTodayInspections();
  const { data: upcomingInspections, isLoading: upcomingLoading } =
    useUpcomingInspections(5);

  const numberFormat = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
    [i18n.language],
  );

  const { hiveNameMap, activeHiveCount } = useMemo(() => {
    const names = new Map<string, string>();
    let active = 0;
    for (const hive of hives ?? []) {
      names.set(hive.id, hive.name);
      if (hive.status === 'ACTIVE') active++;
    }
    return { hiveNameMap: names, activeHiveCount: active };
  }, [hives]);

  const getHiveName = useCallback(
    (hiveId: string) => hiveNameMap.get(hiveId) || hiveId,
    [hiveNameMap],
  );

  const {
    setReschedulingInspection,
    handleDoInspection,
    rescheduleDialogElement,
  } = useScheduledInspectionActions(getHiveName);

  const overdueCount = overdueInspections?.length ?? 0;
  const dueTodayCount = dueTodayInspections?.length ?? 0;
  const upcomingCount = upcomingInspections?.length ?? 0;
  const inspectionsLoading =
    overdueLoading || dueTodayLoading || upcomingLoading;
  const hasInspections =
    overdueCount > 0 || dueTodayCount > 0 || upcomingCount > 0;

  if (!activeApiaryId) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <span className="font-overline text-muted-foreground">
          {t('reports.widget.title')}
        </span>
        <p className="mt-2 font-display text-xl text-foreground/80">
          {t('reports.widget.noApiary')}
        </p>
      </div>
    );
  }

  // Only the apiary itself gates the header; statistics fill in when ready.
  if (apiaryLoading) {
    return <HeaderSkeleton />;
  }

  const featurePhotoUrl =
    imageMode !== 'hidden' ? apiary?.featurePhotoUrl : null;
  // Side image is only applied when the container is wide enough (@md = 28rem = 448px).
  // Below that, fall back to a top banner so the content has room to breathe.
  const allowSide = imageMode === 'side' && !!featurePhotoUrl;

  const imageBlock = featurePhotoUrl && (
    <FeaturePhoto
      src={featurePhotoUrl}
      alt={t('common:photo.featureAlt', { name: apiary?.name ?? '' })}
      className={
        allowSide
          ? 'w-full @md/header:w-[200px] @lg/header:w-[240px] flex-shrink-0 h-40 @sm/header:h-48 @md/header:h-auto @md/header:min-h-[260px]'
          : 'w-full h-40 @sm/header:h-48 @md/header:h-56'
      }
      overlayClassName={cn(
        allowSide &&
          '@md/header:bg-gradient-to-r @md/header:from-transparent @md/header:via-transparent @md/header:to-card/10',
      )}
      tint
    />
  );

  const overline = t(
    'inspection:dashboard.activeHives',
    '{{count}} active hives',
    {
      count: activeHiveCount,
    },
  );

  const averageScore = statistics?.healthScores.averageOverall;

  return (
    <>
      <div className="@container/header">
        <section
          className={cn(
            'group/header relative rounded-xl overflow-hidden border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(120,80,20,0.08)]',
            'flex flex-col',
            allowSide && '@md/header:flex-row',
          )}
        >
          {imageBlock}

          <div className="flex-1 min-w-0 flex flex-col">
            {/* Actions: own row, right-aligned, never crowds the title */}
            <div className="flex flex-wrap justify-end gap-1.5 px-4 @sm/header:px-5 @lg/header:px-6 pt-4">
              <ActionLink
                to={`/apiaries/${activeApiaryId}`}
                icon={<MapPin />}
                label={t('reports.widget.apiaryDetails')}
              />
              <ActionLink
                to="/reports"
                icon={<FileBarChart />}
                label={t('reports.widget.viewReports')}
              />
              <ActionLink
                to="/calendar"
                icon={<CalendarDays />}
                label={t('inspection:dashboard.viewCalendar', 'Calendar')}
              />
            </div>

            {/* Overline + apiary name as an editorial block */}
            <div className="px-4 @sm/header:px-5 @lg/header:px-6 pt-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex size-1.5 shrink-0 rounded-full bg-success ring-[3px] ring-success/15" />
                <span className="font-overline text-muted-foreground truncate">
                  {overline}
                </span>
              </div>
              <h2 className="mt-1.5 font-display text-2xl @sm/header:text-3xl @lg/header:text-4xl font-medium leading-[1.05] text-foreground break-words">
                {apiary?.name ?? t('reports.widget.title')}
              </h2>
            </div>

            {/* Metric row — stacks at narrow widths, becomes a hairline-divided trio at @lg+ */}
            <div className="px-4 @sm/header:px-5 @lg/header:px-6 pt-4 @sm/header:pt-5 pb-5">
              {statsLoading ? (
                <MetricsSkeleton />
              ) : (
                statistics && (
                  <div className="grid grid-cols-1 @lg/header:grid-cols-3 gap-3 @lg/header:gap-0 @lg/header:divide-x @lg/header:-mx-2">
                    <Metric
                      size="lg"
                      className="py-1 @lg/header:px-2"
                      label={t('reports.honeyProduction')}
                      value={numberFormat.format(
                        statistics.honeyProduction.totalAmount,
                      )}
                      unit={statistics.honeyProduction.unit}
                      tone="honey"
                    />
                    <Metric
                      size="lg"
                      className="py-1 @lg/header:px-3"
                      label={t('reports.healthScores')}
                      value={
                        averageScore ? numberFormat.format(averageScore) : '—'
                      }
                      unit={
                        averageScore
                          ? t('inspection:units.outOfTen')
                          : undefined
                      }
                      icon={
                        <ScoreLevelCue
                          value={averageScore}
                          className="self-center"
                        />
                      }
                      tone={getScoreTone(averageScore)}
                    />
                    <Metric
                      size="lg"
                      className="py-1 @lg/header:px-3"
                      label={t('reports.feedingTotals')}
                      value={numberFormat.format(
                        statistics.feedingTotals.totalSugarKg,
                      )}
                      unit="kg"
                    />
                  </div>
                )
              )}
            </div>

            {/* Inspection section, set apart with a hairline */}
            {!inspectionsLoading && hasInspections && (
              <div className="mt-auto border-t px-4 @sm/header:px-5 @lg/header:px-6 py-4 space-y-3 bg-muted/40">
                {(overdueCount > 0 || dueTodayCount > 0) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {overdueCount > 0 && (
                      <StatusPill tone="danger" asChild>
                        <Link to="/inspections?status=OVERDUE">
                          <AlertTriangle />
                          <span className="tabular-nums">{overdueCount}</span>
                          <span>
                            {t('inspection:dashboard.overdue', 'overdue')}
                          </span>
                        </Link>
                      </StatusPill>
                    )}
                    {dueTodayCount > 0 && (
                      // Local calendar date, not the UTC one from toISOString().
                      <StatusPill tone="warning" asChild>
                        <Link
                          to={`/inspections?status=SCHEDULED&date=${format(new Date(), 'yyyy-MM-dd')}`}
                        >
                          <Clock />
                          <span className="tabular-nums">{dueTodayCount}</span>
                          <span>
                            {t('inspection:dashboard.dueToday', 'due today')}
                          </span>
                        </Link>
                      </StatusPill>
                    )}
                  </div>
                )}

                {upcomingCount > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-overline text-muted-foreground">
                      {t('inspection:dashboard.upcoming', 'Upcoming')}
                    </h3>
                    <div className="space-y-1.5">
                      {upcomingInspections?.map(inspection => (
                        <UpcomingInspectionListItem
                          key={inspection.id}
                          inspection={inspection}
                          hiveName={getHiveName(inspection.hiveId)}
                          onDoInspection={handleDoInspection}
                          onReschedule={setReschedulingInspection}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {rescheduleDialogElement}
    </>
  );
};
