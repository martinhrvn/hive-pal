import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  ArrowDownUp,
  Bluetooth,
  Cpu,
  HeartPulse,
  Scale,
  type LucideIcon,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  HiveScaleDevice,
  HiveScaleHiveReading,
  HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';
import { hiveSlotName, type HiveMappingBySlot } from './hivehub-links';

// Night-mode idle bit of the HiveTraffic status bitfield — the one bit with a
// published meaning (firmware/include/bee_counter_wire.h in HiveHub).
const BEE_COUNTER_STATUS_NIGHT_IDLE = 0x80;

// Hub subsystems that report a pass/fail flag. The hub sends no code with a
// failure, so each fault carries the reason text from `health.hubReason.*`.
const HUB_CHECKS = [
  'sht_ok',
  'rtc_ok',
  'sd_ok',
  'mic_ok',
  'mic_left_ok',
  'mic_right_ok',
  'battery_monitor_ok',
  'solar_monitor_ok',
] as const;

type HubCheck = (typeof HUB_CHECKS)[number];
type CheckState = 'ok' | 'fault' | 'absent';

const STATE_BADGE: Record<CheckState, string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  fault:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
  absent: 'text-muted-foreground',
};

const isNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const stateOf = (ok: boolean | null | undefined): CheckState =>
  ok == null ? 'absent' : ok ? 'ok' : 'fault';

const hexByte = (v: number) =>
  `0x${(Number(v) & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;

const timeOf = (iso: string | null | undefined) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isFinite(t) ? t : -Infinity;
};

const hiveOf = (m: HiveScaleMeasurement | undefined, n: number) =>
  m?.hives?.find(h => Number(h.index) === n);

// Only 0x80 is specified, so every other bit is shown raw for matching against
// the counter's own firmware notes rather than translated into a guess.
function beeCounterStatusText(t: TFunction, flags: number): string {
  const byte = Number(flags) & 0xff;
  const parts: string[] = [];
  if (byte & BEE_COUNTER_STATUS_NIGHT_IDLE)
    parts.push(t('health.counter.nightIdle'));
  const rest = byte & ~BEE_COUNTER_STATUS_NIGHT_IDLE;
  if (rest) parts.push(t('health.counter.otherBits', { hex: hexByte(rest) }));
  return parts.length ? parts.join(', ') : t('health.counter.noFlags');
}

interface CheckRow {
  key: string;
  icon: LucideIcon;
  label: string;
  state: CheckState;
  stateLabel?: string;
  meta?: ReactNode;
  code?: string | null;
  detail?: string | null;
}

function CheckRowView({ row }: Readonly<{ row: CheckRow }>) {
  const { t } = useTranslation('hivescale');
  const Icon = row.icon;
  return (
    <li className="flex items-start gap-2 py-1.5 text-sm">
      <Icon
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0',
          row.state === 'fault'
            ? 'text-red-600 dark:text-red-400'
            : 'text-muted-foreground',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium leading-tight">{row.label}</span>
          <Badge
            variant="outline"
            className={cn('shrink-0 text-[10px]', STATE_BADGE[row.state])}
          >
            {row.stateLabel ??
              (row.state === 'ok'
                ? t('health.state.ok')
                : row.state === 'fault'
                  ? t('health.state.fault')
                  : t('health.state.notFitted'))}
          </Badge>
        </div>
        {row.meta && (
          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {row.meta}
          </div>
        )}
        {row.detail && (
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            {row.code && (
              <code className="mr-1 rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">
                {row.code}
              </code>
            )}
            {row.detail}
          </p>
        )}
      </div>
    </li>
  );
}

const metaBits = (bits: (string | null | undefined | false)[]) => {
  const kept = bits.filter((b): b is string => !!b);
  return kept.length
    ? kept.map((bit, i) => <span key={i}>{bit}</span>)
    : undefined;
};

/**
 * Pass/fail health of every subsystem HiveHub reports: the hub's own sensors
 * plus, per hive, its scale, in-hive BLE node, HiveTraffic counter and
 * HiveHeart. A null flag means "not fitted / not configured" and is never
 * counted as a fault.
 *
 * `measurements` is optional history; with it, a silent node's fault line says
 * when it was last heard, as HiveHub's own dashboard does.
 */
export function HiveHubSensorHealthCard({
  device,
  latest,
  hiveNames,
  measurements,
}: Readonly<{
  device: HiveScaleDevice;
  latest?: HiveScaleMeasurement;
  hiveNames: HiveMappingBySlot;
  measurements?: HiveScaleMeasurement[];
}>) {
  const { t } = useTranslation('hivescale');

  // Newest first, so the first hit of a scan is the most recent reading.
  const history = useMemo(() => {
    const rows = [...(measurements ?? [])];
    if (latest && !rows.some(r => r.id === latest.id)) rows.push(latest);
    return rows.sort((a, b) => timeOf(b.measured_at) - timeOf(a.measured_at));
  }, [latest, measurements]);
  const hasHistory = (measurements?.length ?? 0) > 0;

  const { hubRows, hiveSections, faults } = useMemo(() => {
    const newestWhere = (probe: (m: HiveScaleMeasurement) => boolean) =>
      history.find(probe) ?? null;
    // Identity fields persist across a missed scan: a node that went unheard
    // still has a name worth showing.
    const lastKnown = <K extends string>(
      n: number,
      group: 'ble' | 'bee_counter',
      key: K,
    ): string | null => {
      for (const m of history) {
        const block = hiveOf(m, n)?.[group] as
          | Record<string, unknown>
          | null
          | undefined;
        const value = block?.[key];
        if (value != null && value !== '') return String(value);
      }
      return null;
    };
    const ago = (iso: string) =>
      formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

    const hub: CheckRow[] = HUB_CHECKS.map((field: HubCheck) => {
      const state = stateOf(latest?.[field]);
      return {
        key: field,
        icon: Cpu,
        label: t(`health.hub.${field}`),
        state,
        detail: state === 'fault' ? t(`health.hubReason.${field}`) : null,
      };
    });

    const hives = [...(latest?.hives ?? [])].sort((a, b) => a.index - b.index);
    const sections = hives.map((hive: HiveScaleHiveReading) => {
      const n = hive.index;
      const rows: CheckRow[] = [];

      const scaleOk = hive.scale_ok ?? (isNum(hive.weight_kg) ? true : null);
      if (scaleOk != null) {
        rows.push({
          key: 'scale',
          icon: Scale,
          label: t('health.sensor.scale'),
          state: stateOf(scaleOk),
          meta: metaBits([
            isNum(hive.weight_kg) ? `${hive.weight_kg.toFixed(2)} kg` : null,
            hive.scale_source,
          ]),
          detail: scaleOk ? null : t('health.reason.scale'),
        });
      }

      const ble = hive.ble;
      const heard = hive.accel?.ok;
      const bleSeen =
        ble != null &&
        [ble.sensor_type, ble.device_name, ble.mac, ble.board].some(
          v => v != null && v !== '',
        );
      if (bleSeen || heard != null || ble?.present != null) {
        const silent = heard === false || ble?.present === false;
        const type = ble?.sensor_type || lastKnown(n, 'ble', 'sensor_type');
        const board = ble?.board || lastKnown(n, 'ble', 'board');
        const nodeName =
          ble?.device_name ||
          lastKnown(n, 'ble', 'device_name') ||
          ble?.mac ||
          lastKnown(n, 'ble', 'mac');
        let detail: string | null = null;
        if (silent) {
          const kind = type
            ? board
              ? `${type} (${board})`
              : type
            : t('health.reason.inHiveKindFallback');
          const parts = [t('health.reason.inHive', { kind })];
          if (nodeName) parts.push(t('health.reason.node', { node: nodeName }));
          if (hasHistory) {
            const last = newestWhere(m => hiveOf(m, n)?.accel?.ok === true);
            parts.push(
              last
                ? t('health.reason.lastHeard', { ago: ago(last.measured_at) })
                : t('health.reason.notHeardInRange'),
            );
          }
          detail = parts.join(' ');
        }
        rows.push({
          key: 'inHive',
          icon: Bluetooth,
          label: type
            ? board
              ? `${type} (${board})`
              : type
            : t('health.sensor.inHive'),
          state: silent ? 'fault' : 'ok',
          stateLabel: silent ? t('health.state.notHeard') : undefined,
          meta: metaBits([
            ble?.device_name,
            ble?.mac,
            ble?.firmware_version &&
              t('health.meta.firmware', { version: ble.firmware_version }),
            isNum(ble?.battery_percent)
              ? t('health.meta.batteryPercent', {
                  value: Math.round(ble.battery_percent),
                })
              : isNum(ble?.battery_mv)
                ? t('health.meta.batteryMv', {
                    value: Math.round(ble.battery_mv),
                  })
                : null,
            isNum(ble?.rssi_dbm)
              ? t('health.meta.rssi', { value: Math.round(ble.rssi_dbm) })
              : null,
          ]),
          detail,
        });
      }

      const bc = hive.bee_counter;
      if (bc && bc.ok != null) {
        const flags = bc.status_flags;
        const nightIdle =
          isNum(flags) && (flags & BEE_COUNTER_STATUS_NIGHT_IDLE) !== 0;
        let detail: string | null = null;
        let code: string | null = null;
        if (!bc.ok) {
          // A counter that never answered cannot annotate its own failure, so
          // the code shown is the status from the last read that succeeded.
          const parts = [t('health.reason.counter')];
          const node =
            lastKnown(n, 'bee_counter', 'device_name') ||
            lastKnown(n, 'bee_counter', 'mac');
          if (node) parts.push(t('health.reason.counterNode', { node }));
          const last = newestWhere(m => hiveOf(m, n)?.bee_counter?.ok === true);
          if (hasHistory) {
            parts.push(
              last
                ? t('health.reason.lastAnswered', {
                    ago: ago(last.measured_at),
                  })
                : t('health.reason.notAnsweredInRange'),
            );
          }
          const lastBc = last ? hiveOf(last, n)?.bee_counter : null;
          if (isNum(lastBc?.status_flags)) {
            parts.push(
              t('health.reason.statusThen', {
                status: beeCounterStatusText(t, lastBc.status_flags),
              }),
            );
            code = t('health.counter.statusCode', {
              hex: hexByte(lastBc.status_flags),
            });
          }
          if (isNum(lastBc?.mcps_healthy)) {
            parts.push(
              t('health.reason.expandersThen', { count: lastBc.mcps_healthy }),
            );
          }
          detail = parts.join(' ');
        }
        const banks = isNum(bc.banks)
          ? [1, 2, 3].filter(bank => (bc.banks! >> (bank - 1)) & 1)
          : null;
        rows.push({
          key: 'counter',
          icon: ArrowDownUp,
          label: t('health.sensor.counter'),
          state: stateOf(bc.ok),
          code,
          meta: metaBits([
            bc.version && t('health.meta.firmware', { version: bc.version }),
            nightIdle && t('health.counter.nightIdleBadge'),
            isNum(bc.mcps_healthy) &&
              t('health.counter.expanders', { count: bc.mcps_healthy }),
            isNum(bc.glitch_count) &&
              t('health.counter.glitches', { count: bc.glitch_count }),
            banks &&
              (banks.length
                ? t('health.counter.banks', { list: banks.join(', ') })
                : t('health.counter.noBanks')),
          ]),
          detail,
        });
      }

      const hh = hive.hiveheart;
      if (
        hh &&
        (hh.present != null ||
          [hh.battery_v, hh.rssi_dbm, hh.frequency_hz, hh.energy].some(isNum))
      ) {
        const silent = hh.present === false;
        rows.push({
          key: 'hiveheart',
          icon: HeartPulse,
          label: t('health.sensor.hiveheart'),
          state: silent ? 'fault' : 'ok',
          stateLabel: silent ? t('health.state.notHeard') : undefined,
          meta: metaBits([
            isNum(hh.battery_v)
              ? t('health.meta.batteryV', { value: hh.battery_v.toFixed(2) })
              : null,
            isNum(hh.rssi_dbm)
              ? t('health.meta.rssi', { value: Math.round(hh.rssi_dbm) })
              : null,
          ]),
          detail: silent ? t('health.reason.hiveheart') : null,
        });
      }

      return { n, rows };
    });

    const count =
      hub.filter(r => r.state === 'fault').length +
      sections.reduce(
        (sum, s) => sum + s.rows.filter(r => r.state === 'fault').length,
        0,
      );
    return { hubRows: hub, hiveSections: sections, faults: count };
  }, [history, hasHistory, latest, t]);

  const anyReported =
    hubRows.some(r => r.state !== 'absent') ||
    hiveSections.some(s => s.rows.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{t('health.title')}</CardTitle>
            <CardDescription>
              {latest?.measured_at
                ? t('health.descriptionAt', {
                    ago: formatDistanceToNowStrict(
                      new Date(latest.measured_at),
                      { addSuffix: true },
                    ),
                  })
                : t('health.description', {
                    name: device.display_name || device.device_id,
                  })}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0',
              !anyReported
                ? STATE_BADGE.absent
                : faults
                  ? STATE_BADGE.fault
                  : STATE_BADGE.ok,
            )}
          >
            {!anyReported
              ? t('health.summary.noData')
              : faults
                ? t('health.summary.faults', { count: faults })
                : t('health.summary.allOk')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!latest ? (
          <p className="text-sm text-muted-foreground">{t('health.noData')}</p>
        ) : (
          <>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('health.hubHeading')}
              </h3>
              <ul className="divide-y">
                {hubRows.map(row => (
                  <CheckRowView key={row.key} row={row} />
                ))}
              </ul>
            </section>

            {hiveSections.map(({ n, rows }) => (
              <section key={n}>
                <h3 className="flex items-baseline gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="normal-case text-foreground">
                    {hiveSlotName(hiveNames, n, t('health.hiveIndex', { n }))}
                  </span>
                  {hiveNames[n]?.trim() && (
                    <span>{t('health.hiveIndex', { n })}</span>
                  )}
                </h3>
                {rows.length ? (
                  <ul className="divide-y">
                    {rows.map(row => (
                      <CheckRowView key={row.key} row={row} />
                    ))}
                  </ul>
                ) : (
                  <p className="py-1.5 text-xs text-muted-foreground">
                    {t('health.noHiveSensors')}
                  </p>
                )}
              </section>
            ))}

            {faults > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('health.faultNote')}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
