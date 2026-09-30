import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNowStrict } from 'date-fns';
import { AlertTriangle, Battery, Radio, Sun } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useHiveScaleDeviceConfig,
  type HiveScaleDevice,
  type HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';

// A reading older than this many send intervals means the hub has missed
// check-ins, not just that the next one is due.
const STALE_CYCLES = 3;
const FALLBACK_STALE_MS = 30 * 60000;

const BADGE_CLASS = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  fault:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
  warn: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
} as const;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const isNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const fmt = (v: number | null | undefined, digits: number, unit = '') =>
  isNum(v) ? `${v.toFixed(digits)}${unit ? ` ${unit}` : ''}` : '—';

const timeOf = (iso: string | null | undefined) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isFinite(t) ? t : null;
};

type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor';

const signalQuality = (rssi: number): SignalQuality =>
  rssi >= -60
    ? 'excellent'
    : rssi >= -70
      ? 'good'
      : rssi >= -80
        ? 'fair'
        : 'poor';

const SIGNAL_BADGE: Record<SignalQuality, string> = {
  excellent: BADGE_CLASS.good,
  good: BADGE_CLASS.good,
  fair: BADGE_CLASS.warn,
  poor: BADGE_CLASS.fault,
};

function StatusRow({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 text-right font-medium tabular-nums">
        {children}
      </span>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  children,
}: Readonly<{ icon: typeof Radio; children: ReactNode }>) {
  return (
    <h3 className="flex items-center gap-1.5 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {children}
    </h3>
  );
}

function StampValue({ iso }: Readonly<{ iso: string | null | undefined }>) {
  const t = timeOf(iso);
  if (t == null) return <span>—</span>;
  return (
    <span title={dateFormatter.format(t)}>
      {formatDistanceToNowStrict(t, { addSuffix: true })}
    </span>
  );
}

/**
 * The hub itself: uplink, clock, power and whether it is still checking in.
 * Everything here is device-level; per-hive sensors live in the health card.
 */
export function HiveHubHubStatusCard({
  device,
  latest,
  measurements,
}: Readonly<{
  device: HiveScaleDevice;
  latest?: HiveScaleMeasurement;
  measurements?: HiveScaleMeasurement[];
}>) {
  const { t } = useTranslation('hivescale');
  const config = useHiveScaleDeviceConfig(device.device_id);

  const m = useMemo(() => {
    if (latest) return latest;
    let newest: HiveScaleMeasurement | undefined;
    for (const row of measurements ?? []) {
      if ((timeOf(row.measured_at) ?? -1) > (timeOf(newest?.measured_at) ?? -1))
        newest = row;
    }
    return newest;
  }, [latest, measurements]);

  const intervalS = config.data?.send_interval_seconds;
  const staleLimitMs =
    isNum(intervalS) && intervalS > 0
      ? STALE_CYCLES * intervalS * 1000
      : FALLBACK_STALE_MS;
  const readingAt = timeOf(m?.measured_at);
  const stale = readingAt != null && Date.now() - readingAt > staleLimitMs;

  const rssi = m?.rssi_dbm;
  const quality = isNum(rssi) ? signalQuality(rssi) : null;
  const transport = m?.network_transport?.trim().toLowerCase();
  const transportLabel = !transport
    ? '—'
    : transport === 'wifi' || transport === 'cellular'
      ? t(`hubStatus.transport.${transport}`)
      : m?.network_transport;

  const batteryV = m?.battery_voltage_v ?? m?.battery_voltage;
  const hasSolar =
    m?.solar_monitor_ok === true ||
    [
      m?.solar_power_mw,
      m?.solar_current_ma,
      m?.solar_bus_voltage_v,
      m?.solar_load_voltage_v,
    ].some(isNum);

  const firmware = m?.firmware_version || device.last_firmware_version;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{t('hubStatus.title')}</CardTitle>
            <CardDescription>{t('hubStatus.description')}</CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {m?.inspection && (
              <Badge variant="outline" className={BADGE_CLASS.warn}>
                {t('hubStatus.badge.inspection')}
              </Badge>
            )}
            {m?.calibration_mode && (
              <Badge variant="outline" className={BADGE_CLASS.warn}>
                {t('hubStatus.badge.calibration')}
              </Badge>
            )}
            {m && !m.inspection && !m.calibration_mode && (
              <Badge
                variant="outline"
                className={stale ? BADGE_CLASS.fault : BADGE_CLASS.good}
              >
                {stale ? t('hubStatus.badge.stale') : t('hubStatus.badge.live')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {!m ? (
          <p className="text-sm text-muted-foreground">
            {t('hubStatus.noData')}
          </p>
        ) : (
          <>
            {stale && readingAt != null && (
              <div
                className={cn(
                  'mb-2 flex items-start gap-2 rounded-md border p-2 text-xs',
                  BADGE_CLASS.fault,
                )}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {t('hubStatus.staleWarning', {
                    ago: formatDistanceToNowStrict(readingAt),
                  })}
                </span>
              </div>
            )}

            <SectionHeading icon={Radio}>
              {t('hubStatus.section.connectivity')}
            </SectionHeading>
            <div className="divide-y">
              <StatusRow label={t('hubStatus.row.signal')}>
                <span>{fmt(rssi, 0, 'dBm')}</span>
                {quality && (
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', SIGNAL_BADGE[quality])}
                  >
                    {t(`hubStatus.signalQuality.${quality}`)}
                  </Badge>
                )}
              </StatusRow>
              <StatusRow label={t('hubStatus.row.transport')}>
                {transportLabel}
              </StatusRow>
              <StatusRow label={t('hubStatus.row.timeSource')}>
                <span>{m.time_source || '—'}</span>
                {m.rtc_ok != null && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      m.rtc_ok ? BADGE_CLASS.good : BADGE_CLASS.fault,
                    )}
                  >
                    {m.rtc_ok
                      ? t('hubStatus.rtc.ok')
                      : t('hubStatus.rtc.fault')}
                  </Badge>
                )}
              </StatusRow>
              <StatusRow label={t('hubStatus.row.lastSeen')}>
                <StampValue iso={device.last_seen_at} />
              </StatusRow>
              <StatusRow label={t('hubStatus.row.lastReading')}>
                <StampValue iso={m.measured_at} />
              </StatusRow>
              <StatusRow label={t('hubStatus.row.firmware')}>
                {firmware || '—'}
              </StatusRow>
              <StatusRow label={t('hubStatus.row.bootCount')}>
                {isNum(m.boot_count) ? m.boot_count.toLocaleString() : '—'}
              </StatusRow>
            </div>

            <SectionHeading icon={Battery}>
              {t('hubStatus.section.battery')}
            </SectionHeading>
            <div className="divide-y">
              <StatusRow label={t('hubStatus.row.stateOfCharge')}>
                {fmt(m.battery_soc_percent, 0, '%')}
              </StatusRow>
              <StatusRow label={t('hubStatus.row.batteryVoltage')}>
                {fmt(batteryV, 2, 'V')}
              </StatusRow>
              {m.battery_alert && (
                <StatusRow label={t('hubStatus.row.batteryAlert')}>
                  <Badge variant="outline" className={BADGE_CLASS.fault}>
                    {t('hubStatus.batteryAlertActive')}
                  </Badge>
                </StatusRow>
              )}
            </div>

            {hasSolar && (
              <>
                <SectionHeading icon={Sun}>
                  {t('hubStatus.section.solar')}
                </SectionHeading>
                <div className="divide-y">
                  <StatusRow label={t('hubStatus.row.solarPower')}>
                    {fmt(m.solar_power_mw, 0, 'mW')}
                  </StatusRow>
                  <StatusRow label={t('hubStatus.row.solarCurrent')}>
                    {fmt(m.solar_current_ma, 0, 'mA')}
                  </StatusRow>
                  <StatusRow label={t('hubStatus.row.solarBus')}>
                    {fmt(m.solar_bus_voltage_v, 2, 'V')}
                  </StatusRow>
                  <StatusRow label={t('hubStatus.row.solarLoad')}>
                    {fmt(m.solar_load_voltage_v, 2, 'V')}
                  </StatusRow>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
