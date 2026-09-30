import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  ArrowDownUp,
  Bluetooth,
  ChevronDown,
  HeartPulse,
  Loader2,
  Scale,
  type LucideIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  flatHiveField,
  useHiveScaleDeviceConfig,
  type HiveScaleDevice,
  type HiveScaleHiveReading,
  type HiveScaleInsightAlert,
  type HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';
import {
  HiveScaleAlertList,
  HiveScaleSeverityPill,
  sortAlerts,
} from './hivescale-insights-card';
import { HiveScaleInsightsHistoryDialog } from './hivescale-insights-history-dialog';
import {
  allHiveSlots,
  hiveSlotName,
  type HiveMappingBySlot,
} from './hivehub-links';

// Carry-forward window, mirroring HiveHub's dashboard: a value missing from the
// newest upload may be shown from an older one for this many cycles. The floor
// keeps a fast test loop from expiring values at once; the ceiling keeps a
// down-sampled history from stretching the apparent cycle.
const STALE_CYCLES = 3;
const MIN_STALE_MS = 15 * 60000;
const MAX_STALE_MS = 24 * 3600000;
const DEFAULT_CYCLE_MS = 60 * 60000;
const DAY_MS = 24 * 3600000;
// How far the reference reading may sit from "24 h ago" and still be called a
// 24 h change — otherwise a short history would pass off a 2 h delta as 24 h.
const DELTA_TOLERANCE_MS = 6 * 3600000;

const isNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const timeOf = (m: HiveScaleMeasurement) => {
  const t = new Date(m.measured_at).getTime();
  return Number.isFinite(t) ? t : null;
};

const hiveOf = (m: HiveScaleMeasurement | undefined, n: number) =>
  m?.hives?.find(h => Number(h.index) === n);

// 85 °C is the DS18B20 power-on value, which is what a disconnected probe reads.
const cleanTemp = (v: number | null | undefined) =>
  isNum(v) && !(v >= 84.5 && v <= 85.5) ? v : null;

// Median gap between the newest rows: one long sleep or a backfilled SD import
// cannot stretch it the way a mean would.
function observedCycleMs(rows: HiveScaleMeasurement[]): number {
  const times = rows
    .slice(0, 6)
    .map(timeOf)
    .filter((t): t is number => t != null);
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const gap = times[i - 1] - times[i];
    if (gap > 0) gaps.push(gap);
  }
  if (!gaps.length) return DEFAULT_CYCLE_MS;
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

// Rows whose hive fields were blanked by an inspection, not merely unreported.
function inspectionMasked(m: HiveScaleMeasurement, n: number) {
  if (!m.inspection) return false;
  const hives = m.inspection_hives;
  if (!Array.isArray(hives) || !hives.length) return true;
  return hives.some(h => Number(h) === n);
}

interface Reading<T> {
  value: T;
  at: string;
  stale: boolean;
  row: HiveScaleMeasurement;
}

function readingBy<T>(
  rows: HiveScaleMeasurement[],
  n: number,
  limitMs: number,
  pick: (m: HiveScaleMeasurement) => T | null,
): Reading<T> | null {
  if (!rows.length) return null;
  const newest = timeOf(rows[0]);
  for (const m of rows) {
    const value = pick(m);
    if (value != null) {
      const at = timeOf(m);
      if (at != null && newest != null && newest - at > limitMs) return null;
      return {
        value,
        at: m.measured_at,
        stale: at != null && newest != null && at < newest,
        row: m,
      };
    }
    // A blanked row is a deliberate silence, not a missed cycle: stop rather
    // than reach around the inspection for an older value.
    if (inspectionMasked(m, n)) return null;
  }
  return null;
}

const compensatedWeight = (m: HiveScaleMeasurement, n: number) => {
  const v = flatHiveField<number>(m, 'scale', n, 'weight_kg_compensated');
  return isNum(v) ? v : null;
};
const rawWeight = (m: HiveScaleMeasurement, n: number) => {
  const v = hiveOf(m, n)?.weight_kg;
  return isNum(v) ? v : null;
};

type SensorState = 'ok' | 'fault';
interface SensorIcon {
  key: string;
  icon: LucideIcon;
  labelKey: string;
  state: SensorState;
}

function sensorIcons(hive: HiveScaleHiveReading | undefined): SensorIcon[] {
  if (!hive) return [];
  const out: SensorIcon[] = [];
  const scaleOk = hive.scale_ok ?? (isNum(hive.weight_kg) ? true : null);
  if (scaleOk != null)
    out.push({
      key: 'scale',
      icon: Scale,
      labelKey: 'hiveCards.sensor.scale',
      state: scaleOk ? 'ok' : 'fault',
    });
  const ble = hive.ble;
  const bleSeen =
    ble != null &&
    [ble.sensor_type, ble.device_name, ble.mac, ble.board].some(
      v => v != null && v !== '',
    );
  if (bleSeen || hive.accel?.ok != null || ble?.present != null)
    out.push({
      key: 'inHive',
      icon: Bluetooth,
      labelKey: 'hiveCards.sensor.inHive',
      state:
        hive.accel?.ok === false || ble?.present === false ? 'fault' : 'ok',
    });
  if (hive.bee_counter?.ok != null)
    out.push({
      key: 'counter',
      icon: ArrowDownUp,
      labelKey: 'hiveCards.sensor.counter',
      state: hive.bee_counter.ok ? 'ok' : 'fault',
    });
  const hh = hive.hiveheart;
  if (
    hh &&
    (hh.present != null ||
      [hh.battery_v, hh.rssi_dbm, hh.frequency_hz, hh.energy].some(isNum))
  )
    out.push({
      key: 'hiveheart',
      icon: HeartPulse,
      labelKey: 'hiveCards.sensor.hiveheart',
      state: hh.present === false ? 'fault' : 'ok',
    });
  return out;
}

function MetricValue({
  label,
  reading,
  digits,
  unit,
  sub,
  large,
}: Readonly<{
  label: string;
  reading: Reading<number> | null;
  digits: number;
  unit: string;
  sub?: string | null;
  large?: boolean;
}>) {
  const { t } = useTranslation('hivescale');
  const age = reading?.stale
    ? formatDistanceToNowStrict(new Date(reading.at), { addSuffix: true })
    : null;
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-semibold tabular-nums',
          large ? 'text-2xl' : 'text-lg',
          reading?.stale && 'text-muted-foreground',
        )}
        title={age ? t('hiveCards.lastReported', { ago: age }) : undefined}
      >
        {reading ? reading.value.toFixed(digits) : '—'}
        {reading && (
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      {(sub || age) && (
        <p className="truncate text-xs text-muted-foreground">
          {[sub, age].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}

function HiveCard({
  deviceId,
  n,
  name,
  named,
  rows,
  limitMs,
  alerts,
  scale1Name,
  scale2Name,
  insightsLoading,
  insightsError,
}: Readonly<{
  deviceId: string;
  n: number;
  name: string;
  named: boolean;
  rows: HiveScaleMeasurement[];
  limitMs: number;
  alerts: HiveScaleInsightAlert[];
  scale1Name: string;
  scale2Name: string;
  insightsLoading?: boolean;
  insightsError?: boolean;
}>) {
  const { t } = useTranslation('hivescale');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const latest = rows[0];
  const hive = hiveOf(latest, n);

  const { weight, delta, temp, humidity } = useMemo(() => {
    // The column is decided per row — compensated only exists where
    // compensation ran — and the delta reuses it so the two cannot disagree.
    const weightReading = readingBy(rows, n, limitMs, m => {
      const comp = compensatedWeight(m, n);
      if (comp != null) return { kg: comp, comp: true };
      const raw = rawWeight(m, n);
      return raw != null ? { kg: raw, comp: false } : null;
    });
    let weightDelta: number | null = null;
    const at = weightReading ? timeOf(weightReading.row) : null;
    if (weightReading && at != null) {
      const target = at - DAY_MS;
      const pick = weightReading.value.comp ? compensatedWeight : rawWeight;
      let best: { kg: number; off: number } | null = null;
      for (const m of rows) {
        const tm = timeOf(m);
        if (tm == null || tm >= at) continue;
        const kg = pick(m, n);
        if (kg == null) continue;
        const off = Math.abs(tm - target);
        if (off <= DELTA_TOLERANCE_MS && (!best || off < best.off))
          best = { kg, off };
      }
      if (best) weightDelta = weightReading.value.kg - best.kg;
    }
    const toNumber = (
      r: Reading<{ kg: number; comp: boolean }> | null,
    ): Reading<number> | null => (r ? { ...r, value: r.value.kg } : null);
    return {
      weight: toNumber(weightReading),
      delta: weightDelta,
      temp: readingBy(rows, n, limitMs, m => cleanTemp(hiveOf(m, n)?.temp_c)),
      humidity: readingBy(rows, n, limitMs, m => {
        const h = hiveOf(m, n);
        const v = h?.humidity_percent ?? h?.ble?.humidity_percent;
        return isNum(v) ? v : null;
      }),
    };
  }, [rows, n, limitMs]);

  const icons = sensorIcons(hive);
  const counter = hive?.bee_counter;
  const inspected =
    !!latest?.inspection &&
    (!latest.inspection_hives?.length ||
      latest.inspection_hives.some(h => Number(h) === n));
  const highest = alerts[0]?.severity;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{name}</CardTitle>
            {named && (
              <p className="text-xs text-muted-foreground">
                {t('hiveCards.hiveIndex', { n })}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {inspected && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
              >
                {t('hiveCards.inspection')}
              </Badge>
            )}
            {insightsLoading ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-muted-foreground"
                aria-label={t('hiveCards.insightsLoading')}
              />
            ) : insightsError ? (
              <span className="text-[10px] text-muted-foreground">
                {t('hiveCards.insightsUnavailable')}
              </span>
            ) : (
              <HiveScaleSeverityPill severity={highest} count={alerts.length} />
            )}
            <HiveScaleInsightsHistoryDialog
              deviceId={deviceId}
              scale1Name={scale1Name}
              scale2Name={scale2Name}
              // The dialog filters by any channel number at runtime; its prop
              // type still names only the legacy two scales.
              channel={n}
              compact
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3">
          <MetricValue
            label={t('hiveCards.weight')}
            reading={weight}
            digits={2}
            unit="kg"
            large
            sub={
              delta != null
                ? t('hiveCards.delta24h', {
                    value: `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`,
                  })
                : null
            }
          />
          <MetricValue
            label={t('hiveCards.temperature')}
            reading={temp}
            digits={1}
            unit="°C"
          />
          <MetricValue
            label={t('hiveCards.humidity')}
            reading={humidity}
            digits={0}
            unit="%"
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-2">
          <div className="flex items-center gap-1.5">
            {icons.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {t('hiveCards.noSensors')}
              </span>
            ) : (
              icons.map(({ key, icon: Icon, labelKey, state }) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-md border',
                        state === 'ok'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
                      )}
                      aria-label={t(labelKey)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t(labelKey)} ·{' '}
                    {state === 'ok'
                      ? t('hiveCards.state.ok')
                      : t('hiveCards.state.fault')}
                  </TooltipContent>
                </Tooltip>
              ))
            )}
          </div>
          {counter?.ok != null && (
            <span
              className="text-xs tabular-nums text-muted-foreground"
              title={t('hiveCards.trafficTitle')}
            >
              {t('hiveCards.traffic', {
                in: isNum(counter.interval_in) ? counter.interval_in : '—',
                out: isNum(counter.interval_out) ? counter.interval_out : '—',
              })}
            </span>
          )}
        </div>

        {!insightsLoading && !insightsError && alerts.length > 0 && (
          <Collapsible open={alertsOpen} onOpenChange={setAlertsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-between px-2 text-xs"
              >
                {t('hiveCards.alerts', { count: alerts.length })}
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    alertsOpen && 'rotate-180',
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <HiveScaleAlertList
                alerts={alerts}
                scale1Name={scale1Name}
                scale2Name={scale2Name}
                showHive={false}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * One card per hive: current weight, climate, sensors and alerts at a glance.
 * A value missing from the newest upload is carried forward from a recent one
 * (muted, with its age) so a single missed BLE scan does not blank the card.
 */
export function HiveHubHiveCards({
  device,
  measurements,
  hiveNames,
  alerts,
  insightsLoading,
  insightsError,
}: Readonly<{
  device: HiveScaleDevice;
  measurements?: HiveScaleMeasurement[];
  hiveNames: HiveMappingBySlot;
  alerts: HiveScaleInsightAlert[];
  insightsLoading?: boolean;
  insightsError?: boolean;
}>) {
  const { t } = useTranslation('hivescale');
  const config = useHiveScaleDeviceConfig(device.device_id);

  const rows = useMemo(
    () =>
      [...(measurements ?? [])]
        .filter(m => timeOf(m) != null)
        .sort((a, b) => timeOf(b)! - timeOf(a)!),
    [measurements],
  );

  const intervalS = config.data?.send_interval_seconds;
  const limitMs = useMemo(() => {
    const cycle =
      isNum(intervalS) && intervalS > 0
        ? intervalS * 1000
        : observedCycleMs(rows);
    return Math.min(Math.max(STALE_CYCLES * cycle, MIN_STALE_MS), MAX_STALE_MS);
  }, [intervalS, rows]);

  const slots = useMemo(() => {
    const set = new Set<number>();
    for (const h of rows[0]?.hives ?? []) set.add(Number(h.index));
    for (const slot of allHiveSlots())
      if (hiveNames[slot]?.trim()) set.add(slot);
    return [...set].filter(n => n >= 1).sort((a, b) => a - b);
  }, [rows, hiveNames]);

  const alertsBySlot = useMemo(() => {
    const map = new Map<number, HiveScaleInsightAlert[]>();
    for (const alert of sortAlerts(alerts)) {
      const list = map.get(alert.channel) ?? [];
      list.push(alert);
      map.set(alert.channel, list);
    }
    return map;
  }, [alerts]);

  if (!slots.length) {
    return (
      <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        {t('hiveCards.empty')}
      </p>
    );
  }

  const scale1Name = hiveSlotName(
    hiveNames,
    1,
    t('hiveCards.hiveIndex', { n: 1 }),
  );
  const scale2Name = hiveSlotName(
    hiveNames,
    2,
    t('hiveCards.hiveIndex', { n: 2 }),
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {slots.map(n => (
        <HiveCard
          key={n}
          deviceId={device.device_id}
          n={n}
          name={hiveSlotName(hiveNames, n, t('hiveCards.hiveIndex', { n }))}
          named={!!hiveNames[n]?.trim()}
          rows={rows}
          limitMs={limitMs}
          alerts={alertsBySlot.get(n) ?? []}
          scale1Name={scale1Name}
          scale2Name={scale2Name}
          insightsLoading={insightsLoading}
          insightsError={insightsError}
        />
      ))}
    </div>
  );
}
