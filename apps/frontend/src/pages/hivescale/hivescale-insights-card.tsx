import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  HiveScaleInsightAlert,
  HiveScaleInsightSeverity,
  useHiveScaleInsights,
} from '@/api/hooks/useHiveScale';
import { HiveScaleInsightsHistoryDialog } from './hivescale-insights-history-dialog';

interface HiveScaleInsightsCardProps {
  deviceId: string;
  scale1Name: string;
  scale2Name: string;
  lookbackDays?: number;
}

/**
 * Public link to the long-form description of every detector. Lives in the
 * HiveScale backend repo because the algorithms (and their thresholds) live
 * there too.
 */
const INSIGHTS_DOCS_URL =
  'https://github.com/MacNite/HiveScale/tree/main/docs/insights.md';

/**
 * Short, human-readable summary of every detector currently implemented in
 * `server/insights.py`. The list of titles/details is provided by the
 * translation file (`insights.detectors`); keep that in sync with
 * `docs/insights.md` and with the detectors in `compute_insights()`.
 */
interface DetectorSummary {
  title: string;
  detail: string;
}

/**
 * Visual config per severity. Mirrors the four levels emitted by the
 * HiveScale backend's `insights.py` (see server/insights.py for sources).
 */
export const severityConfig: Record<
  HiveScaleInsightSeverity,
  {
    labelKey: string;
    icon: typeof Info;
    badgeClass: string;
    rowClass: string;
    iconClass: string;
    rank: number;
  }
> = {
  critical: {
    labelKey: 'insights.severity.critical',
    icon: AlertOctagon,
    badgeClass:
      'bg-red-100 text-red-900 border-red-200 dark:bg-red-900/40 dark:text-red-100 dark:border-red-800',
    rowClass:
      'border-red-200 bg-red-50/60 dark:bg-red-950/30 dark:border-red-900',
    iconClass: 'text-red-600 dark:text-red-400',
    rank: 4,
  },
  warning: {
    labelKey: 'insights.severity.warning',
    icon: AlertTriangle,
    badgeClass:
      'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800',
    rowClass:
      'border-amber-200 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-900',
    iconClass: 'text-amber-600 dark:text-amber-400',
    rank: 3,
  },
  watch: {
    labelKey: 'insights.severity.watch',
    icon: Eye,
    badgeClass:
      'bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-100 dark:border-yellow-800',
    rowClass:
      'border-yellow-200 bg-yellow-50/60 dark:bg-yellow-950/30 dark:border-yellow-900',
    iconClass: 'text-yellow-600 dark:text-yellow-500',
    rank: 2,
  },
  info: {
    labelKey: 'insights.severity.info',
    icon: Info,
    badgeClass:
      'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800',
    rowClass:
      'border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-900',
    iconClass: 'text-blue-600 dark:text-blue-400',
    rank: 1,
  },
};

export function severityRank(severity: HiveScaleInsightSeverity): number {
  return severityConfig[severity]?.rank ?? 0;
}

export function severityLabel(
  t: TFunction,
  severity: HiveScaleInsightSeverity,
): string {
  const cfg = severityConfig[severity] ?? severityConfig.info;
  return t(cfg.labelKey);
}

export function channelLabel(
  channel: number,
  scale1Name: string,
  scale2Name: string,
  t: TFunction,
): string {
  if (channel === 1) return scale1Name;
  if (channel === 2) return scale2Name;
  return t('insights.hiveChannel', { channel });
}

/**
 * Sort alerts by severity (highest first), then by most recent window end.
 */
export function sortAlerts(
  alerts: HiveScaleInsightAlert[] | undefined,
): HiveScaleInsightAlert[] {
  if (!alerts) return [];
  return [...alerts].sort((a, b) => {
    const sev = severityRank(b.severity) - severityRank(a.severity);
    if (sev !== 0) return sev;
    const ta = a.window_end ? new Date(a.window_end).getTime() : 0;
    const tb = b.window_end ? new Date(b.window_end).getTime() : 0;
    return tb - ta;
  });
}

/**
 * Info tooltip listing every active detector plus a link to the full docs.
 * Extracted so it can be reused outside the standalone insights card.
 */
export function InsightsInfoTooltip() {
  const { t } = useTranslation('hivescale');
  const rawDetectors = t('insights.detectors', { returnObjects: true });
  const detectors: DetectorSummary[] = Array.isArray(rawDetectors)
    ? (rawDetectors as DetectorSummary[])
    : [];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label={t('insights.tooltip.ariaLabel')}
        >
          <Info className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-md space-y-2 text-left"
      >
        <p className="font-medium">{t('insights.tooltip.title')}</p>
        <p className="text-xs text-muted-foreground">
          {t('insights.tooltip.description')}
        </p>
        <ul className="space-y-1.5 text-xs">
          {detectors.map(d => (
            <li key={d.title}>
              <span className="font-medium">{d.title}:</span>{' '}
              <span className="text-muted-foreground">{d.detail}</span>
            </li>
          ))}
        </ul>
        <a
          href={INSIGHTS_DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
        >
          {t('insights.tooltip.fullDocs')}
          <ExternalLink className="h-3 w-3" />
        </a>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Renders a list of insight alerts using the shared severity styling.
 * `showHive` controls whether the per-row hive label is shown (useful when
 * the list is already scoped to a single hive).
 */
export function HiveScaleAlertList({
  alerts,
  scale1Name,
  scale2Name,
  showHive = true,
}: Readonly<{
  alerts: HiveScaleInsightAlert[];
  scale1Name: string;
  scale2Name: string;
  showHive?: boolean;
}>) {
  const { t } = useTranslation('hivescale');
  return (
    <ul className="space-y-2">
      {alerts.map(alert => {
        const cfg = severityConfig[alert.severity];
        const Icon = cfg.icon;
        const windowEnd = alert.window_end ? new Date(alert.window_end) : null;
        const hiveName = channelLabel(
          alert.channel,
          scale1Name,
          scale2Name,
          t,
        );

        return (
          <li
            key={alert.id}
            className={cn(
              'rounded-md border p-3 transition-colors',
              cfg.rowClass,
            )}
          >
            <div className="flex items-start gap-3">
              <Icon
                className={cn('mt-0.5 h-5 w-5 shrink-0', cfg.iconClass)}
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="font-medium leading-tight">{alert.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', cfg.badgeClass)}
                    >
                      {t(cfg.labelKey)}
                    </Badge>
                    {showHive && (
                      <span className="text-xs text-muted-foreground">
                        {hiveName}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {alert.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {t('insights.confidence', {
                      value: Math.round((alert.confidence ?? 0) * 100),
                    })}
                  </span>
                  {windowEnd && (
                    <span>
                      {formatDistanceToNowStrict(windowEnd, {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  {alert.source && (
                    <span className="truncate">
                      {t('insights.source', { source: alert.source })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function HiveScaleInsightsCard({
  deviceId,
  scale1Name,
  scale2Name,
  lookbackDays = 14,
}: HiveScaleInsightsCardProps) {
  const { t } = useTranslation('hivescale');
  const insights = useHiveScaleInsights(deviceId, { lookbackDays });

  const sortedAlerts = useMemo<HiveScaleInsightAlert[]>(
    () => sortAlerts(insights.data?.alerts),
    [insights.data?.alerts],
  );

  const severityCounts = useMemo(() => {
    const counts: Record<HiveScaleInsightSeverity, number> = {
      critical: 0,
      warning: 0,
      watch: 0,
      info: 0,
    };
    for (const alert of sortedAlerts) {
      counts[alert.severity] += 1;
    }
    return counts;
  }, [sortedAlerts]);

  const computedAt = insights.data?.computed_at
    ? new Date(insights.data.computed_at)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {t('insights.title')}
              {insights.isFetching && !insights.isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <InsightsInfoTooltip />
            </CardTitle>
            <CardDescription>
              {t('insights.description')}
              {computedAt && (
                <>
                  {' '}
                  {t('insights.updated', {
                    ago: formatDistanceToNowStrict(computedAt, {
                      addSuffix: true,
                    }),
                  })}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <HiveScaleInsightsHistoryDialog
              deviceId={deviceId}
              scale1Name={scale1Name}
              scale2Name={scale2Name}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => insights.refetch()}
              disabled={insights.isFetching}
              aria-label={t('insights.refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {insights.isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : insights.isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {t('insights.loadError', {
              message:
                (insights.error as Error)?.message ??
                t('common.unknownError'),
            })}
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t('insights.allClear')}</p>
              <p className="text-xs text-muted-foreground">
                {t('insights.noActiveAlerts', { count: lookbackDays })}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Severity summary */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('insights.activeAlerts', { count: sortedAlerts.length })}
              </span>
              {(['critical', 'warning', 'watch', 'info'] as const).map(
                severity =>
                  severityCounts[severity] > 0 ? (
                    <Badge
                      key={severity}
                      variant="outline"
                      className={cn(severityConfig[severity].badgeClass)}
                    >
                      {t(severityConfig[severity].labelKey)}:{' '}
                      {severityCounts[severity]}
                    </Badge>
                  ) : null,
              )}
            </div>

            {/* Alert list */}
            <HiveScaleAlertList
              alerts={sortedAlerts}
              scale1Name={scale1Name}
              scale2Name={scale2Name}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact severity pill suitable for placing inside a card header such as
 * the per-hive `LatestValuePanel`. Pass the highest severity for the channel
 * and an optional count; renders nothing when severity is null.
 */
export function HiveScaleSeverityPill({
  severity,
  count,
  className,
}: Readonly<{
  severity: HiveScaleInsightSeverity | null | undefined;
  count?: number;
  className?: string;
}>) {
  const { t } = useTranslation('hivescale');
  if (!severity) return null;
  const cfg = severityConfig[severity];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 px-1.5 py-0 text-[10px] font-medium',
        cfg.badgeClass,
        className,
      )}
    >
      <Icon className={cn('h-3 w-3', cfg.iconClass)} aria-hidden />
      <span>{t(cfg.labelKey)}</span>
      {count && count > 1 ? <span>· {count}</span> : null}
    </Badge>
  );
}