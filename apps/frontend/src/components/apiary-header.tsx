import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  FileBarChart,
  MapPin,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
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

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);

const getScoreTone = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'text-stone-400 dark:text-stone-500';
  if (value >= 6) return 'text-emerald-700 dark:text-emerald-400';
  if (value >= 3) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

type MetricProps = {
  label: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  valueClassName?: string;
};

const Metric: React.FC<MetricProps> = ({ label, value, unit, valueClassName }) => (
  <div className="flex flex-col items-start gap-1 py-1">
    <div
      className={cn(
        'font-display text-2xl @sm/header:text-2xl @lg/header:text-3xl leading-none tabular-nums',
        valueClassName,
      )}
    >
      {value}
      {unit && (
        <span className="ml-1 text-sm font-normal text-stone-500 dark:text-stone-400 tracking-tight">
          {unit}
        </span>
      )}
    </div>
    <span className="font-overline text-stone-500 dark:text-stone-400">
      {label}
    </span>
  </div>
);

const ActionLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => (
  <Link
    to={to}
    aria-label={label}
    className="group inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-900/40 backdrop-blur-sm px-2 @sm/header:px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 transition-all hover:border-amber-500/70 hover:text-stone-900 dark:hover:text-white hover:shadow-sm"
  >
    <span className="text-stone-500 dark:text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
      {icon}
    </span>
    <span className="hidden @xl/header:inline">{label}</span>
  </Link>
);

export const ApiaryHeader: React.FC = () => {
  const { t } = useTranslation(['common', 'inspection']);
  const navigate = useNavigate();
  const { activeApiaryId } = useApiaryStore();
  const { data: statistics, isLoading: statsLoading } = useApiaryStatistics(
    activeApiaryId ?? undefined,
    'ytd',
  );
  const { data: apiary } = useApiary(activeApiaryId ?? '', {
    enabled: !!activeApiaryId,
  });
  const { data: hives } = useHives();

  const { mode: imageMode } = useImageDisplayStore();

  const { data: overdueInspections, isLoading: overdueLoading } =
    useOverdueInspections();
  const { data: dueTodayInspections, isLoading: dueTodayLoading } =
    useDueTodayInspections();
  const { data: upcomingInspections, isLoading: upcomingLoading } =
    useUpcomingInspections(5);

  const hiveNameMap = useMemo(() => {
    if (!hives) return new Map<string, string>();
    return new Map(hives.map(hive => [hive.id, hive.name]));
  }, [hives]);

  const getHiveName = (hiveId: string) => hiveNameMap.get(hiveId) || hiveId;

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
  const activeHiveCount = hives?.filter(h => h.status === 'ACTIVE').length ?? 0;

  const handleViewOverdue = () => {
    navigate('/inspections?status=OVERDUE');
  };

  const handleViewDueToday = () => {
    navigate(
      '/inspections?status=SCHEDULED&date=' +
        new Date().toISOString().split('T')[0],
    );
  };

  if (statsLoading) {
    return (
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-card overflow-hidden">
        <Skeleton className="h-44 w-full rounded-none" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-56" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!activeApiaryId) {
    return (
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-card p-6">
        <span className="font-overline text-stone-500">
          {t('reports.widget.title')}
        </span>
        <p className="mt-2 font-display text-xl text-stone-700 dark:text-stone-300">
          {t('reports.widget.noApiary')}
        </p>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const hasImage = imageMode !== 'hidden' && !!apiary?.featurePhotoUrl;
  // Side image is only applied when the container is wide enough (@md = 28rem = 448px).
  // Below that, fall back to a top banner so the content has room to breathe.
  const allowSide = imageMode === 'side' && hasImage;

  const imageBlock = hasImage && (
    <div
      className={cn(
        'relative overflow-hidden bg-stone-100 dark:bg-stone-900',
        allowSide
          ? 'w-full @md/header:w-[200px] @lg/header:w-[240px] flex-shrink-0 h-40 @sm/header:h-48 @md/header:h-auto @md/header:min-h-[260px]'
          : 'w-full h-40 @sm/header:h-48 @md/header:h-56',
      )}
    >
      <img
        src={apiary!.featurePhotoUrl!}
        alt={`${apiary?.name ?? ''} feature photo`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          allowSide
            ? '@md/header:bg-gradient-to-r @md/header:from-transparent @md/header:via-transparent @md/header:to-card/10 bg-gradient-to-t from-card/40 via-transparent to-transparent'
            : 'bg-gradient-to-t from-card/40 via-transparent to-transparent',
        )}
      />
      <div className="absolute inset-0 pointer-events-none bg-amber-500/[0.04]" />
    </div>
  );

  const overline = t('inspection:dashboard.activeHives', '{{count}} active hives', {
    count: activeHiveCount,
  });

  return (
    <>
      <div className="@container/header">
      <section
        className={cn(
          'group/header relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(120,80,20,0.08)]',
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
              icon={<MapPin className="h-3.5 w-3.5" />}
              label={t('reports.widget.apiaryDetails')}
            />
            <ActionLink
              to="/reports"
              icon={<FileBarChart className="h-3.5 w-3.5" />}
              label={t('reports.widget.viewReports')}
            />
            <ActionLink
              to="/calendar"
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label={t('inspection:dashboard.viewCalendar', 'Calendar')}
            />
          </div>

          {/* Overline + apiary name as an editorial block */}
          <div className="px-4 @sm/header:px-5 @lg/header:px-6 pt-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
              <span className="font-overline text-stone-500 dark:text-stone-400 truncate">
                {overline}
              </span>
            </div>
            <h2 className="mt-1.5 font-display text-2xl @sm/header:text-3xl @lg/header:text-4xl font-medium leading-[1.05] text-stone-900 dark:text-stone-50 break-words">
              {apiary?.name ?? t('reports.widget.title')}
            </h2>
          </div>

          {/* Metric row — stacks at narrow widths, becomes a hairline-divided trio at @sm+ */}
          <div className="px-4 @sm/header:px-5 @lg/header:px-6 pt-4 @sm/header:pt-5 pb-5">
            <div className="grid grid-cols-1 @lg/header:grid-cols-3 gap-3 @lg/header:gap-0 @lg/header:divide-x @lg/header:divide-stone-200 @lg/header:dark:divide-stone-800 @lg/header:-mx-2">
              <div className="@lg/header:px-2">
                <Metric
                  label={t('reports.honeyProduction')}
                  value={formatNumber(statistics.honeyProduction.totalAmount)}
                  unit={statistics.honeyProduction.unit}
                  valueClassName="text-amber-700 dark:text-amber-400"
                />
              </div>
              <div className="@lg/header:px-3">
                <Metric
                  label={t('reports.healthScores')}
                  value={
                    statistics.healthScores.averageOverall
                      ? formatNumber(statistics.healthScores.averageOverall)
                      : '—'
                  }
                  unit={statistics.healthScores.averageOverall ? '/ 10' : undefined}
                  valueClassName={getScoreTone(
                    statistics.healthScores.averageOverall,
                  )}
                />
              </div>
              <div className="@lg/header:px-3">
                <Metric
                  label={t('reports.feedingTotals')}
                  value={formatNumber(statistics.feedingTotals.totalSugarKg)}
                  unit="kg"
                  valueClassName="text-stone-800 dark:text-stone-100"
                />
              </div>
            </div>
          </div>

          {/* Inspection section, set apart with a hairline */}
          {!inspectionsLoading && hasInspections && (
            <div className="mt-auto border-t border-stone-200 dark:border-stone-800 px-4 @sm/header:px-5 @lg/header:px-6 py-4 space-y-3 bg-stone-50/60 dark:bg-stone-900/40">
              {(overdueCount > 0 || dueTodayCount > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                  {overdueCount > 0 && (
                    <button
                      onClick={handleViewOverdue}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-200 dark:ring-red-900 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{overdueCount}</span>
                      <span>
                        {t('inspection:dashboard.overdue', 'overdue')}
                      </span>
                    </button>
                  )}
                  {dueTodayCount > 0 && (
                    <button
                      onClick={handleViewDueToday}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-900 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{dueTodayCount}</span>
                      <span>
                        {t('inspection:dashboard.dueToday', 'due today')}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {upcomingCount > 0 && (
                <div className="space-y-2">
                  <h4 className="font-overline text-stone-500 dark:text-stone-400">
                    {t('inspection:dashboard.upcoming', 'Upcoming')}
                  </h4>
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
