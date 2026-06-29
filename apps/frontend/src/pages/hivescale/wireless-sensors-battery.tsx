import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { HiveScaleMeasurement } from '@/api/hooks/useHiveScale';

// The HiveHeart and HiveScale only report a raw battery voltage. These windows
// map that voltage to an approximate state-of-charge so every wireless sensor
// can be shown on the same 0–100% scale as the percentage-reporting in-hive BLE
// sensor. The values are intentionally conservative single-cell estimates and
// are easy to tune should the hardware use a different chemistry.
const VOLTAGE_WINDOWS = {
  // HiveHeart — lithium primary cell, decoded range ~2.0–3.5 V.
  hiveheart: { empty: 2.5, full: 3.3 },
  // HiveScale — single LiPo cell.
  hivescale: { empty: 3.3, full: 4.2 },
} as const;

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const voltageToPercent = (
  voltage: number,
  window: { empty: number; full: number },
) =>
  clampPercent(((voltage - window.empty) / (window.full - window.empty)) * 100);

type SensorBattery = {
  key: string;
  name: string;
  percent: number;
};

const isNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// Builds the (at most six) wireless sensors that currently report a battery
// level, in a stable order: HiveHeart, then the in-hive BLE sensor, then the
// wireless weight scale — channel 1 before channel 2.
const collectSensors = (
  measurement: HiveScaleMeasurement | undefined,
  channel1Name: string,
  channel2Name: string,
  labels: { hiveHeart: string; inHive: string; scale: string },
): SensorBattery[] => {
  if (!measurement) return [];
  const channelName = (channel: 1 | 2) =>
    channel === 1 ? channel1Name : channel2Name;

  const candidates: Array<{
    key: string;
    type: keyof typeof labels;
    channel: 1 | 2;
    percent: number | null;
  }> = [
    {
      key: 'hiveheart_1',
      type: 'hiveHeart',
      channel: 1,
      percent: isNumber(measurement.hiveheart_1_battery_v)
        ? voltageToPercent(
            measurement.hiveheart_1_battery_v,
            VOLTAGE_WINDOWS.hiveheart,
          )
        : null,
    },
    {
      key: 'hiveheart_2',
      type: 'hiveHeart',
      channel: 2,
      percent: isNumber(measurement.hiveheart_2_battery_v)
        ? voltageToPercent(
            measurement.hiveheart_2_battery_v,
            VOLTAGE_WINDOWS.hiveheart,
          )
        : null,
    },
    {
      key: 'ble_1',
      type: 'inHive',
      channel: 1,
      percent: isNumber(measurement.ble_1_battery_percent)
        ? clampPercent(measurement.ble_1_battery_percent)
        : null,
    },
    {
      key: 'ble_2',
      type: 'inHive',
      channel: 2,
      percent: isNumber(measurement.ble_2_battery_percent)
        ? clampPercent(measurement.ble_2_battery_percent)
        : null,
    },
    {
      key: 'hivescale_1',
      type: 'scale',
      channel: 1,
      percent: isNumber(measurement.hivescale_1_battery_v)
        ? voltageToPercent(
            measurement.hivescale_1_battery_v,
            VOLTAGE_WINDOWS.hivescale,
          )
        : null,
    },
    {
      key: 'hivescale_2',
      type: 'scale',
      channel: 2,
      percent: isNumber(measurement.hivescale_2_battery_v)
        ? voltageToPercent(
            measurement.hivescale_2_battery_v,
            VOLTAGE_WINDOWS.hivescale,
          )
        : null,
    },
  ];

  return candidates
    .filter((c): c is typeof c & { percent: number } => c.percent !== null)
    .map(c => ({
      key: c.key,
      name: `${labels[c.type]} · ${channelName(c.channel)}`,
      percent: Math.round(c.percent),
    }));
};

// Tailwind text colour for the battery fill, mirroring the discrete
// red → orange → green progression used elsewhere for charge state.
const levelColor = (percent: number) => {
  if (percent <= 10) return 'text-red-500';
  if (percent <= 30) return 'text-orange-500';
  if (percent <= 60) return 'text-lime-500';
  return 'text-emerald-500';
};

// A small battery glyph whose inner bar fills proportionally to `percent`. At a
// critical charge the fill is replaced by a warning bolt, matching the
// empty-battery indicator in the reference design.
function BatteryIcon({ percent }: Readonly<{ percent: number }>) {
  const color = levelColor(percent);
  const critical = percent <= 10;
  // Inner track runs from x=2.5 to x=18.5 (width 16).
  const fillWidth = (16 * percent) / 100;

  return (
    <svg
      viewBox="0 0 26 14"
      className={`h-4 w-7 ${color}`}
      fill="none"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="21"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="23" y="4.5" width="2.5" height="5" rx="1" fill="currentColor" />
      {critical ? (
        <path
          d="M12 3 L8.5 7.8 H11 L10 11 L14 6.2 H11.3 Z"
          fill="currentColor"
        />
      ) : (
        <rect
          x="2.5"
          y="2.5"
          width={fillWidth}
          height="9"
          rx="1"
          fill="currentColor"
        />
      )}
    </svg>
  );
}

export function WirelessSensorsBattery({
  measurement,
  channel1Name,
  channel2Name,
}: Readonly<{
  measurement: HiveScaleMeasurement | undefined;
  channel1Name: string;
  channel2Name: string;
}>) {
  const { t } = useTranslation('hivescale');

  const sensors = collectSensors(measurement, channel1Name, channel2Name, {
    hiveHeart: t('panel.sensorTypes.hiveHeart'),
    inHive: t('panel.sensorTypes.inHive'),
    scale: t('panel.sensorTypes.scale'),
  });

  if (sensors.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <span
      className="grid w-fit grid-flow-row grid-cols-3 justify-items-end gap-x-2 gap-y-1.5"
      role="group"
      aria-label={t('panel.wirelessSensorsBattery')}
    >
      {sensors.map(sensor => (
        <Tooltip key={sensor.key}>
          <TooltipTrigger asChild>
            <span
              className="inline-flex cursor-default items-center"
              aria-label={`${sensor.name}: ${sensor.percent}%`}
            >
              <BatteryIcon percent={sensor.percent} />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <span className="font-medium">{sensor.name}</span> ·{' '}
            {sensor.percent}%
          </TooltipContent>
        </Tooltip>
      ))}
    </span>
  );
}
