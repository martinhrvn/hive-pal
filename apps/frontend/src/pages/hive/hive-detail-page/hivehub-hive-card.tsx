import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import {
  flatHiveField,
  useHiveScaleInsights,
  useHiveScaleMeasurements,
  type HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  useHiveHubSlotsForHive,
  type HiveHubSlotRef,
} from '@/pages/hivescale/hivehub-links';
import {
  HiveHubInspectionStatusBadge,
  formatInspectionTime,
  inspectionCoversSlot,
  useHiveHubInspectionStatus,
} from '@/pages/hivescale/hivehub-inspection-card';
import {
  HiveHubInspectionControl,
  hiveHubDeviceName,
} from '@/pages/hivescale/hivehub-inspection-prompt';
import {
  HiveScaleSeverityPill,
  sortAlerts,
} from '@/pages/hivescale/hivescale-insights-card';

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const slotWeight = (m: HiveScaleMeasurement, slot: number) => {
  const compensated = flatHiveField(m, 'scale', slot, 'weight_kg_compensated');
  if (isNumber(compensated)) return compensated;
  const weight = m.hives?.find(h => h.index === slot)?.weight_kg;
  return isNumber(weight) ? weight : null;
};

// 84.5–85.5 °C is the DS18B20 power-on value, i.e. a disconnected probe.
const slotTemp = (m: HiveScaleMeasurement, slot: number) => {
  const temp = m.hives?.find(h => h.index === slot)?.temp_c;
  return isNumber(temp) && !(temp >= 84.5 && temp <= 85.5) ? temp : null;
};

const slotHumidity = (m: HiveScaleMeasurement, slot: number) => {
  const hive = m.hives?.find(h => h.index === slot);
  const value = hive?.humidity_percent ?? hive?.ble?.humidity_percent;
  return isNumber(value) ? value : null;
};

const fmt = (value: number | null, digits: number, unit: string) =>
  value === null ? '—' : `${value.toFixed(digits)} ${unit}`;

function Stat({
  label,
  value,
  className,
}: Readonly<{ label: string; value: string; className?: string }>) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('truncate text-sm font-medium', className)}>
        {value}
      </div>
    </div>
  );
}

function SlotSection({ slotRef }: Readonly<{ slotRef: HiveHubSlotRef }>) {
  const { t } = useTranslation('hivescale');
  const { device, slot } = slotRef;
  const deviceId = device.device_id;
  // Fixed per mount so the query key (and cache) stays stable across renders.
  const [startAt] = useState(() =>
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  );
  const measurements = useHiveScaleMeasurements(deviceId, {
    start_at: startAt,
    limit: 400,
  });
  const insights = useHiveScaleInsights(deviceId, { lookbackDays: 14 });
  const status = useHiveHubInspectionStatus(deviceId);

  const summary = useMemo(() => {
    const rows = [...(measurements.data ?? [])].sort(
      (a, b) => Date.parse(a.measured_at) - Date.parse(b.measured_at),
    );
    const pick = <T,>(
      list: HiveScaleMeasurement[],
      read: (m: HiveScaleMeasurement) => T | null,
    ) => {
      for (const m of list) {
        const value = read(m);
        if (value !== null) return value;
      }
      return null;
    };
    const newestFirst = [...rows].reverse();
    const weight = pick(newestFirst, m => slotWeight(m, slot));
    const firstWeight = pick(rows, m => slotWeight(m, slot));
    return {
      weight,
      weightChange:
        weight !== null && firstWeight !== null ? weight - firstWeight : null,
      temp: pick(newestFirst, m => slotTemp(m, slot)),
      humidity: pick(newestFirst, m => slotHumidity(m, slot)),
      lastReadingAt: newestFirst[0]?.measured_at ?? null,
    };
  }, [measurements.data, slot]);

  const alerts = useMemo(
    () =>
      sortAlerts(insights.data?.alerts).filter(alert => alert.channel === slot),
    [insights.data?.alerts, slot],
  );

  const inspectionHere =
    !!status.data &&
    (status.data.active || status.data.pending) &&
    inspectionCoversSlot(status.data.inspection, slot);

  const change = summary.weightChange;
  const changeText =
    change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(2)} kg`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 text-sm">
          <span className="font-medium">{slotRef.name}</span>
          <span className="text-muted-foreground">
            {' · '}
            {hiveHubDeviceName(device)}
          </span>
        </div>
        {status.data && (
          <HiveHubInspectionStatusBadge
            status={inspectionHere ? status.data : undefined}
            className="text-[10px]"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label={t('hiveLink.card.weight')}
          value={fmt(summary.weight, 2, 'kg')}
        />
        <Stat
          label={t('hiveLink.card.weightChange24h')}
          value={changeText}
          className={cn(
            change !== null &&
              change > 0 &&
              'text-emerald-700 dark:text-emerald-400',
            change !== null && change < 0 && 'text-red-700 dark:text-red-400',
          )}
        />
        <Stat
          label={t('hiveLink.card.temperature')}
          value={fmt(summary.temp, 1, '°C')}
        />
        <Stat
          label={t('hiveLink.card.humidity')}
          value={fmt(summary.humidity, 0, '%')}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {measurements.isLoading
          ? t('common.loading')
          : t('hiveLink.card.lastReading', {
              time: formatInspectionTime(summary.lastReadingAt),
            })}
      </p>

      {alerts.length > 0 && (
        <ul className="space-y-1">
          {alerts.map(alert => (
            <li key={alert.id} className="flex items-center gap-2 text-sm">
              <HiveScaleSeverityPill severity={alert.severity} />
              <span className="min-w-0 truncate">{alert.title}</span>
            </li>
          ))}
        </ul>
      )}

      <HiveHubInspectionControl
        device={device}
        slot={slot}
        status={status.data}
      />
    </div>
  );
}

/** Compact HiveHub readings for a HivePal hive linked to one or more slots. */
export function HiveHubHiveCard({ hiveId }: Readonly<{ hiveId: string }>) {
  const { t } = useTranslation('hivescale');
  const { slots, isLoading } = useHiveHubSlotsForHive(hiveId);
  if (isLoading || slots.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('hiveLink.card.title')}</CardTitle>
        <CardDescription>{t('hiveLink.card.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {slots.map((ref, index) => (
          <div
            key={`${ref.device.device_id}:${ref.slot}`}
            className={cn(index > 0 && 'border-t pt-4')}
          >
            <SlotSection slotRef={ref} />
          </div>
        ))}
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/hivescale">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            {t('hiveLink.card.openHiveHub')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
