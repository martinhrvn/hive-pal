import { format } from 'date-fns';
import {
  Map,
  ArrowUpRight,
  Cloud,
  CloudRain,
  CloudSun,
  Sun,
  Thermometer,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HiveScore, InspectionStatus } from 'shared-schemas';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HiveMinimap } from '@/components/hive-minimap';
import { StatisticCards } from '@/pages/hive/hive-detail-page/statistic-cards.tsx';
import { cn } from '@/lib/utils';

type InspectionHeaderProps = {
  hiveName: string;
  hiveId: string;
  apiaryId?: string;
  date: string;
  status?: InspectionStatus;
  score?: HiveScore | null;
  temperature?: number | null;
  weatherConditions?: string | null;
  trailing?: React.ReactNode;
};

const getStatusConfig = (status: InspectionStatus | undefined) => {
  switch (status) {
    case InspectionStatus.SCHEDULED:
      return {
        Icon: Clock,
        label: 'Scheduled',
        chipClass:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
        dotClass: 'bg-blue-500',
      };
    case InspectionStatus.OVERDUE:
      return {
        Icon: AlertTriangle,
        label: 'Overdue',
        chipClass:
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
        dotClass: 'bg-red-500',
      };
    case InspectionStatus.COMPLETED:
      return {
        Icon: CheckCircle,
        label: 'Completed',
        chipClass:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
        dotClass: 'bg-emerald-500',
      };
    case InspectionStatus.CANCELLED:
      return {
        Icon: XCircle,
        label: 'Cancelled',
        chipClass:
          'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-900/40 dark:text-stone-400 dark:border-stone-700',
        dotClass: 'bg-stone-400',
      };
    default:
      return {
        Icon: Clock,
        label: 'Unknown',
        chipClass:
          'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-900/40 dark:text-stone-400 dark:border-stone-700',
        dotClass: 'bg-stone-400',
      };
  }
};

const getWeatherIcon = (condition: string) => {
  const cls = 'h-4 w-4';
  switch (condition.toLowerCase()) {
    case 'sunny':
      return <Sun className={cn(cls, 'text-amber-500')} />;
    case 'partly-cloudy':
      return <CloudSun className={cn(cls, 'text-blue-400')} />;
    case 'cloudy':
      return <Cloud className={cn(cls, 'text-stone-500')} />;
    case 'rainy':
      return <CloudRain className={cn(cls, 'text-blue-600')} />;
    default:
      return <Cloud className={cn(cls, 'text-stone-500')} />;
  }
};

const formatWeatherCondition = (c: string) =>
  c
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const InspectionHeader = ({
  hiveName,
  hiveId,
  apiaryId,
  date,
  status,
  score,
  temperature,
  weatherConditions,
  trailing,
}: InspectionHeaderProps) => {
  const { t } = useTranslation('inspection');
  const statusConfig = getStatusConfig(status);
  const dateObj = new Date(date);
  const dayOfWeek = format(dateObj, 'EEEE');
  const dateLine = format(dateObj, 'MMMM d, yyyy');
  const timeLine = format(dateObj, 'h:mm a');

  const hasWeather = temperature != null || !!weatherConditions;

  return (
    <section
      className={cn(
        '@container/insp relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-card',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(120,80,20,0.08)]',
      )}
    >
      {/* faint amber wash */}
      <div className="absolute inset-0 pointer-events-none bg-amber-500/[0.03]" aria-hidden />

      {/* Top stripe — overline + status */}
      <div className="relative px-5 @sm/insp:px-6 @lg/insp:px-8 pt-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 pt-0.5">
          <span
            className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)] shrink-0"
            aria-hidden
          />
          <span className="font-overline text-stone-500 dark:text-stone-400 truncate">
            {t('inspection:detail.eyebrow', {
              defaultValue: 'Field Report',
            })}{' '}
            · {dayOfWeek} · {dateLine}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
              statusConfig.chipClass,
            )}
          >
            <span
              className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dotClass)}
              aria-hidden
            />
            {statusConfig.label}
          </span>
          {trailing}
        </div>
      </div>

      {/* Hive title row */}
      <div className="relative px-5 @sm/insp:px-6 @lg/insp:px-8 pt-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h1 className="font-display text-3xl @sm/insp:text-4xl @lg/insp:text-5xl font-medium leading-[1.02] text-stone-900 dark:text-stone-50 break-words">
            {hiveName}
          </h1>
          <div className="flex items-center gap-1 pb-1">
            {apiaryId && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
                    aria-label="Show apiary layout"
                    title="Show apiary layout"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto max-w-[min(90vw,520px)] p-0"
                >
                  <HiveMinimap
                    apiaryId={apiaryId}
                    highlightedHiveId={hiveId}
                    showHeader={false}
                    className="border-0 shadow-none"
                  />
                </PopoverContent>
              </Popover>
            )}
            <a
              href={`/hives/${hiveId}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
              title={t('inspection:detail.viewHive')}
            >
              {t('inspection:detail.viewHive')}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Time + weather hairline strip */}
      <div className="relative mt-4 border-t border-stone-200 dark:border-stone-800 px-5 @sm/insp:px-6 @lg/insp:px-8 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-nums">{timeLine}</span>
        </div>
        {temperature != null && (
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            <Thermometer className="h-3.5 w-3.5 text-orange-500" />
            <span className="tabular-nums font-medium">{temperature}°C</span>
          </div>
        )}
        {weatherConditions && (
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            {getWeatherIcon(weatherConditions)}
            <span>{formatWeatherCondition(weatherConditions)}</span>
          </div>
        )}
        {!hasWeather && (
          <span className="text-xs italic text-stone-400 dark:text-stone-500">
            {t('inspection:weatherCard.noData', {
              defaultValue: 'No weather recorded',
            })}
          </span>
        )}
      </div>

      {/* Score strip on stone wash */}
      {score && (
        <div className="relative border-t border-stone-200 dark:border-stone-800 px-5 @sm/insp:px-6 @lg/insp:px-8 py-4 bg-stone-50/60 dark:bg-stone-900/40">
          <StatisticCards score={score} variant="inline" />
        </div>
      )}
    </section>
  );
};
