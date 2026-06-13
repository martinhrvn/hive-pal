import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, History, Loader2 } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  HiveScaleInsightHistoryEntry,
  HiveScaleInsightStatus,
  useHiveScaleInsightsHistory,
} from '@/api/hooks/useHiveScale';
import { channelLabel, severityConfig } from './hivescale-insights-card';

interface HiveScaleInsightsHistoryDialogProps {
  deviceId: string;
  scale1Name: string;
  scale2Name: string;
  /** When set, only show history entries for this scale/hive channel. */
  channel?: 1 | 2;
  /** Render an icon-only trigger suitable for inline placement in a panel. */
  compact?: boolean;
}

type StatusFilter = 'all' | HiveScaleInsightStatus;

const STATUS_FILTER_VALUES: StatusFilter[] = ['all', 'active', 'resolved'];

function formatStamp(iso: string | null): string {
  if (!iso) return '—';
  return format(new Date(iso), 'PPp');
}

/**
 * A single history row: shows the alert, its peak severity, and its lifecycle
 * (first seen → resolved / still active).
 */
function HistoryEntryRow({
  entry,
  scale1Name,
  scale2Name,
}: Readonly<{
  entry: HiveScaleInsightHistoryEntry;
  scale1Name: string;
  scale2Name: string;
}>) {
  const { t } = useTranslation('hivescale');
  const cfg = severityConfig[entry.peak_severity] ?? severityConfig.info;
  const Icon = cfg.icon;
  const hiveName = channelLabel(entry.channel, scale1Name, scale2Name, t);
  const isActive = entry.status === 'active';

  return (
    <li className={cn('rounded-md border p-3', cfg.rowClass)}>
      <div className="flex items-start gap-3">
        <Icon
          className={cn('mt-0.5 h-5 w-5 shrink-0', cfg.iconClass)}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-medium leading-tight">{entry.title}</p>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-xs', cfg.badgeClass)}
              >
                {t(cfg.labelKey)}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  isActive
                    ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
                )}
              >
                {isActive
                  ? t('history.status.active')
                  : t('history.status.resolved')}
              </Badge>
              <span className="text-xs text-muted-foreground">{hiveName}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{entry.description}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {t('history.firstSeen', { time: formatStamp(entry.first_seen_at) })}
              {entry.first_seen_at && (
                <>
                  {' '}
                  (
                  {formatDistanceToNowStrict(new Date(entry.first_seen_at), {
                    addSuffix: true,
                  })}
                  )
                </>
              )}
            </span>
            <span aria-hidden>·</span>
            {isActive ? (
              <span>
                {t('history.lastSeen', {
                  time: formatStamp(entry.last_seen_at),
                })}
              </span>
            ) : (
              <span>
                {t('history.resolvedAt', {
                  time: formatStamp(entry.resolved_at),
                })}
              </span>
            )}
            <span aria-hidden>·</span>
            <span>
              {t('history.peakConfidence', {
                value: Math.round((entry.confidence ?? 0) * 100),
              })}
            </span>
            {entry.update_count > 1 && (
              <>
                <span aria-hidden>·</span>
                <span>
                  {t('history.updates', { count: entry.update_count })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function HiveScaleInsightsHistoryDialog({
  deviceId,
  scale1Name,
  scale2Name,
  channel,
  compact = false,
}: HiveScaleInsightsHistoryDialogProps) {
  const { t } = useTranslation('hivescale');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<StatusFilter>('all');

  const statusFilterLabel = (value: StatusFilter): string =>
    t(`history.filter.${value}`);

  const history = useHiveScaleInsightsHistory(
    deviceId,
    { status, limit: 200 },
    { enabled: open },
  );

  const entries = useMemo(() => {
    const all = history.data?.alerts ?? [];
    return channel ? all.filter(entry => entry.channel === channel) : all;
  }, [history.data?.alerts, channel]);

  // The backend response counts are device-wide, so derive the displayed
  // totals from the (possibly channel-filtered) entries instead.
  const shownCount = entries.length;
  const activeCount = entries.filter(
    entry => entry.status === 'active',
  ).length;

  const hiveName = channel
    ? channelLabel(channel, scale1Name, scale2Name, t)
    : null;

  const title = hiveName
    ? `${t('history.title')} · ${hiveName}`
    : t('history.title');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            title={t('history.button')}
            aria-label={t('history.button')}
          >
            <History className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <History className="h-4 w-4" />
            {t('history.button')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            {history.isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </DialogTitle>
          <DialogDescription>{t('history.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <Select
            value={status}
            onValueChange={value => setStatus(value as StatusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_VALUES.map(value => (
                <SelectItem key={value} value={value}>
                  {statusFilterLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {history.data && (
            <span className="text-xs text-muted-foreground">
              {t('history.summary', {
                count: shownCount,
                active: activeCount,
              })}
            </span>
          )}
        </div>

        <div className="-mx-1 max-h-[60vh] overflow-y-auto px-1">
          {history.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : history.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {t('history.loadError', {
                message:
                  (history.error as Error)?.message ??
                  t('common.unknownError'),
              })}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{t('history.empty.title')}</p>
                <p className="text-xs text-muted-foreground">
                  {status !== 'all'
                    ? t('history.empty.descriptionFiltered')
                    : t('history.empty.description')}
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {entries.map(entry => (
                <HistoryEntryRow
                  key={entry.id}
                  entry={entry}
                  scale1Name={scale1Name}
                  scale2Name={scale2Name}
                />
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
