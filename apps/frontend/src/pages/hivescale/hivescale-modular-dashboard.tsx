import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  Battery,
  CheckCircle2,
  Clock,
  Info,
  Plus,
  Thermometer,
  Trash2,
  Weight,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  HiveScaleDevice,
  HiveScaleHiveReading,
  HiveScaleInsightAlert,
  HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';
import {
  createPresetDateRange,
  type HiveScaleDateRange,
  type HiveScaleDateRangePreset,
} from './hivescale-diagram-panel';

const MAX_HIVE_SLOTS = 18;
const DASHBOARD_STORAGE_VERSION = 1;
const dashboardStoragePrefix = 'hivepal:hivescale-dashboard:';

const numberOrDash = (value: number | null | undefined, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '--';

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const cleanTemperature = (value: unknown): number | null => {
  const parsed = toFiniteNumber(value);
  if (parsed === null) return null;
  // DS18B20 disconnected sentinel value.
  if (parsed >= 84.5 && parsed <= 85.5) return null;
  return parsed;
};

const formatChartTick = (value: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatDateTime = (value: string | number | null | undefined) => {
  if (!value) return '--';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '--';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatRelativeTime = (value: string | null | undefined): string => {
  if (!value) return '--';
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return '--';
  const diffMs = Date.now() - ts;
  const absSec = Math.abs(diffMs) / 1000;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (absSec >= secondsInUnit || unit === 'second') {
      const valueInUnit = Math.round(-diffMs / 1000 / secondsInUnit);
      return rtf.format(valueInUnit, unit);
    }
  }

  return '--';
};

type HiveFallbackNames = {
  scale1Name: string;
  scale2Name: string;
};

type HiveSlot = {
  index: number;
  name: string;
  reading: HiveScaleHiveReading | null;
  hasData: boolean;
  weightKg: number | null;
  tempC: number | null;
  humidityPercent: number | null;
  pressureHpa: number | null;
  bleBatteryPercent: number | null;
  sensorSummary: string;
};

type HiveMetricKey =
  | 'weight'
  | 'temperature'
  | 'humidity'
  | 'pressure'
  | 'beeIn'
  | 'beeOut'
  | 'beeNet'
  | 'vibration'
  | 'swarmBand'
  | 'fanningBand'
  | 'activityBand';

type DeviceMetricKey = 'batterySoc' | 'batteryVoltage' | 'solarPower';

type DashboardWidgetKind =
  | 'weightComparison'
  | 'climate'
  | 'power'
  | 'beeTraffic'
  | 'soundRms'
  | 'vibration'
  | 'temperatureHeatmap'
  | 'insights'
  | 'dataQuality';

type DashboardWidgetSize = 'half' | 'wide';

type DashboardWidget = {
  id: string;
  kind: DashboardWidgetKind;
  title: string;
  size: DashboardWidgetSize;
};

type StoredDashboardSettings = {
  version: typeof DASHBOARD_STORAGE_VERSION;
  widgets: DashboardWidget[];
};

type ChartRow = {
  timestamp: number;
  measuredAt: string;
  [key: string]: string | number | null;
};

const chartColors = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--muted-foreground)',
];

const dateRangePresets = [
  '24h',
  '7d',
  '30d',
  '365d',
  'currentYear',
  'all',
] as const satisfies readonly HiveScaleDateRangePreset[];

const widgetTemplates: Record<
  DashboardWidgetKind,
  Omit<DashboardWidget, 'id'> & { description: string; Icon: LucideIcon }
> = {
  weightComparison: {
    kind: 'weightComparison',
    title: 'Weight comparison',
    size: 'wide',
    description: 'Compare selected hives over the current date range.',
    Icon: Weight,
  },
  climate: {
    kind: 'climate',
    title: 'Hive climate',
    size: 'half',
    description: 'Temperature and humidity for selected hives.',
    Icon: Thermometer,
  },
  power: {
    kind: 'power',
    title: 'Power health',
    size: 'half',
    description: 'Battery charge, battery voltage, and solar input.',
    Icon: Battery,
  },
  beeTraffic: {
    kind: 'beeTraffic',
    title: 'Bee traffic',
    size: 'half',
    description: 'Aggregate in/out traffic and net flow.',
    Icon: Activity,
  },
  soundRms: {
    kind: 'soundRms',
    title: 'Sound RMS',
    size: 'half',
    description: 'Stereo microphone loudness trend for the device.',
    Icon: Activity,
  },
  vibration: {
    kind: 'vibration',
    title: 'Vibration bands',
    size: 'half',
    description: 'RMS vibration and swarm band signals.',
    Icon: Activity,
  },
  temperatureHeatmap: {
    kind: 'temperatureHeatmap',
    title: 'Temperature heatmap',
    size: 'wide',
    description: 'Compact all-hive temperature overview.',
    Icon: Thermometer,
  },
  insights: {
    kind: 'insights',
    title: 'Insights feed',
    size: 'half',
    description: 'Active alerts and evidence snippets.',
    Icon: Info,
  },
  dataQuality: {
    kind: 'dataQuality',
    title: 'Data quality',
    size: 'half',
    description: 'Sensor availability and missing readings.',
    Icon: CheckCircle2,
  },
};

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'default-weight-comparison',
    ...widgetTemplates.weightComparison,
  },
  {
    id: 'default-insights',
    ...widgetTemplates.insights,
  },
  {
    id: 'default-climate',
    ...widgetTemplates.climate,
  },
  {
    id: 'default-power',
    ...widgetTemplates.power,
  },
  {
    id: 'default-temperature-heatmap',
    ...widgetTemplates.temperatureHeatmap,
  },
].map(({ description: _description, Icon: _Icon, ...widget }) => widget);

const createWidgetId = (kind: DashboardWidgetKind) =>
  `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const dashboardStorageKey = (deviceId: string) =>
  `${dashboardStoragePrefix}${deviceId}:v${DASHBOARD_STORAGE_VERSION}`;

const loadDashboardSettings = (deviceId: string): DashboardWidget[] => {
  if (typeof globalThis.window === 'undefined') return defaultWidgets;

  try {
    const raw = globalThis.localStorage.getItem(dashboardStorageKey(deviceId));
    if (!raw) return defaultWidgets;
    const parsed = JSON.parse(raw) as Partial<StoredDashboardSettings>;
    if (parsed.version !== DASHBOARD_STORAGE_VERSION) return defaultWidgets;
    if (!Array.isArray(parsed.widgets) || !parsed.widgets.length) {
      return defaultWidgets;
    }

    return parsed.widgets.filter(
      (widget): widget is DashboardWidget =>
        typeof widget?.id === 'string' &&
        typeof widget?.kind === 'string' &&
        widget.kind in widgetTemplates &&
        typeof widget?.title === 'string' &&
        (widget.size === 'half' || widget.size === 'wide'),
    );
  } catch {
    return defaultWidgets;
  }
};

const saveDashboardSettings = (deviceId: string, widgets: DashboardWidget[]) => {
  if (typeof globalThis.window === 'undefined') return;

  try {
    const value: StoredDashboardSettings = {
      version: DASHBOARD_STORAGE_VERSION,
      widgets,
    };
    globalThis.localStorage.setItem(
      dashboardStorageKey(deviceId),
      JSON.stringify(value),
    );
  } catch {
    // Ignore localStorage failures, for example private mode.
  }
};

const legacyHiveReadings = (
  measurement: HiveScaleMeasurement,
  fallbackNames: HiveFallbackNames,
): HiveScaleHiveReading[] => [
  {
    index: 1,
    name: fallbackNames.scale1Name,
    weight_kg:
      measurement.scale_1_weight_kg_compensated ?? measurement.scale_1_weight_kg,
    raw_weight: measurement.scale_1_raw,
    scale_source: null,
    temp_c: measurement.hive_1_temp_c,
    temp_source: null,
    humidity_percent: measurement.ble_1_humidity_percent,
    accel: {
      ok: measurement.accel_1_ok,
      sample_count: measurement.accel_1_sample_count,
      range_g: measurement.accel_1_range_g,
      rms_mg: measurement.accel_1_rms_mg,
      peak_mg: measurement.accel_1_peak_mg,
      band_swarm_mg: measurement.accel_1_band_swarm_mg,
      band_fanning_mg: measurement.accel_1_band_fanning_mg,
      band_activity_mg: measurement.accel_1_band_activity_mg,
    },
    ble: {
      present:
        measurement.ble_1_humidity_percent !== null ||
        measurement.ble_1_pressure_hpa !== null,
      sensor_type: null,
      humidity_percent: measurement.ble_1_humidity_percent,
      pressure_hpa: measurement.ble_1_pressure_hpa,
      battery_percent: measurement.ble_1_battery_percent,
      rssi_dbm: measurement.ble_1_rssi_dbm,
    },
    bee_counter: {
      ok: measurement.bee_counter_1_ok,
      total_in: measurement.bee_counter_1_total_in,
      total_out: measurement.bee_counter_1_total_out,
      interval_in: measurement.bee_counter_1_interval_in,
      interval_out: measurement.bee_counter_1_interval_out,
    },
  },
  {
    index: 2,
    name: fallbackNames.scale2Name,
    weight_kg:
      measurement.scale_2_weight_kg_compensated ?? measurement.scale_2_weight_kg,
    raw_weight: measurement.scale_2_raw,
    scale_source: null,
    temp_c: measurement.hive_2_temp_c,
    temp_source: null,
    humidity_percent: measurement.ble_2_humidity_percent,
    accel: {
      ok: measurement.accel_2_ok,
      sample_count: measurement.accel_2_sample_count,
      range_g: measurement.accel_2_range_g,
      rms_mg: measurement.accel_2_rms_mg,
      peak_mg: measurement.accel_2_peak_mg,
      band_swarm_mg: measurement.accel_2_band_swarm_mg,
      band_fanning_mg: measurement.accel_2_band_fanning_mg,
      band_activity_mg: measurement.accel_2_band_activity_mg,
    },
    ble: {
      present:
        measurement.ble_2_humidity_percent !== null ||
        measurement.ble_2_pressure_hpa !== null,
      sensor_type: null,
      humidity_percent: measurement.ble_2_humidity_percent,
      pressure_hpa: measurement.ble_2_pressure_hpa,
      battery_percent: measurement.ble_2_battery_percent,
      rssi_dbm: measurement.ble_2_rssi_dbm,
    },
    bee_counter: {
      ok: measurement.bee_counter_2_ok,
      total_in: measurement.bee_counter_2_total_in,
      total_out: measurement.bee_counter_2_total_out,
      interval_in: measurement.bee_counter_2_interval_in,
      interval_out: measurement.bee_counter_2_interval_out,
    },
  },
];

const measurementHiveReadings = (
  measurement: HiveScaleMeasurement | undefined,
  fallbackNames: HiveFallbackNames,
): HiveScaleHiveReading[] => {
  if (!measurement) return [];
  const hives = measurement.hives?.filter(
    hive => hive.index >= 1 && hive.index <= MAX_HIVE_SLOTS,
  );
  if (hives?.length) {
    return [...hives].sort((a, b) => a.index - b.index);
  }
  return legacyHiveReadings(measurement, fallbackNames);
};

const hiveMetricValue = (
  hive: HiveScaleHiveReading | null,
  metric: HiveMetricKey,
): number | null => {
  if (!hive) return null;

  switch (metric) {
    case 'weight':
      return toFiniteNumber(hive.weight_kg);
    case 'temperature':
      return cleanTemperature(hive.temp_c);
    case 'humidity':
      return toFiniteNumber(hive.humidity_percent ?? hive.ble?.humidity_percent);
    case 'pressure':
      return toFiniteNumber(hive.ble?.pressure_hpa);
    case 'beeIn':
      return hive.bee_counter?.ok === false
        ? null
        : toFiniteNumber(hive.bee_counter?.interval_in);
    case 'beeOut':
      return hive.bee_counter?.ok === false
        ? null
        : toFiniteNumber(hive.bee_counter?.interval_out);
    case 'beeNet': {
      if (hive.bee_counter?.ok === false) return null;
      const inCount = toFiniteNumber(hive.bee_counter?.interval_in);
      const outCount = toFiniteNumber(hive.bee_counter?.interval_out);
      return inCount !== null && outCount !== null ? inCount - outCount : null;
    }
    case 'vibration':
      return hive.accel?.ok === false ? null : toFiniteNumber(hive.accel?.rms_mg);
    case 'swarmBand':
      return hive.accel?.ok === false
        ? null
        : toFiniteNumber(hive.accel?.band_swarm_mg);
    case 'fanningBand':
      return hive.accel?.ok === false
        ? null
        : toFiniteNumber(hive.accel?.band_fanning_mg);
    case 'activityBand':
      return hive.accel?.ok === false
        ? null
        : toFiniteNumber(hive.accel?.band_activity_mg);
    default:
      return null;
  }
};

const deviceMetricValue = (
  measurement: HiveScaleMeasurement,
  metric: DeviceMetricKey,
): number | null => {
  switch (metric) {
    case 'batterySoc':
      return toFiniteNumber(measurement.battery_soc_percent);
    case 'batteryVoltage':
      return toFiniteNumber(
        measurement.battery_voltage_v ?? measurement.battery_voltage,
      );
    case 'solarPower':
      return toFiniteNumber(measurement.solar_power_mw);
    default:
      return null;
  }
};

const buildHiveSlots = (
  latest: HiveScaleMeasurement | undefined,
  fallbackNames: HiveFallbackNames,
): HiveSlot[] => {
  const readingMap = new Map(
    measurementHiveReadings(latest, fallbackNames).map(hive => [
      hive.index,
      hive,
    ]),
  );

  return Array.from({ length: MAX_HIVE_SLOTS }, (_, i) => {
    const index = i + 1;
    const reading = readingMap.get(index) ?? null;
    const fallbackName =
      index === 1
        ? fallbackNames.scale1Name
        : index === 2
          ? fallbackNames.scale2Name
          : `Hive ${index}`;
    const name = reading?.name?.trim() || fallbackName;
    const weightKg = hiveMetricValue(reading, 'weight');
    const tempC = hiveMetricValue(reading, 'temperature');
    const humidityPercent = hiveMetricValue(reading, 'humidity');
    const pressureHpa = hiveMetricValue(reading, 'pressure');
    const bleBatteryPercent = toFiniteNumber(reading?.ble?.battery_percent);
    const hasBeeCounter = Boolean(
      reading?.bee_counter &&
        (reading.bee_counter.ok != null ||
          reading.bee_counter.total_in != null ||
          reading.bee_counter.total_out != null ||
          reading.bee_counter.interval_in != null ||
          reading.bee_counter.interval_out != null),
    );
    const hasAccel = Boolean(
      reading?.accel &&
        (reading.accel.ok != null ||
          reading.accel.rms_mg != null ||
          reading.accel.peak_mg != null ||
          reading.accel.band_swarm_mg != null ||
          reading.accel.band_fanning_mg != null ||
          reading.accel.band_activity_mg != null),
    );
    const hasBle = Boolean(
      reading?.ble &&
        (reading.ble.present === true ||
          reading.ble.humidity_percent != null ||
          reading.ble.pressure_hpa != null ||
          reading.ble.battery_percent != null ||
          reading.ble.rssi_dbm != null),
    );
    const hasData = [
      weightKg,
      tempC,
      humidityPercent,
      pressureHpa,
      bleBatteryPercent,
      hiveMetricValue(reading, 'vibration'),
      hiveMetricValue(reading, 'beeIn'),
      hiveMetricValue(reading, 'beeOut'),
    ].some(value => value !== null);
    const sensors = [
      weightKg !== null ? 'scale' : null,
      hasBle ? 'in-hive' : null,
      hasAccel ? 'accel' : null,
      hasBeeCounter ? 'counter' : null,
    ].filter(Boolean);

    return {
      index,
      name,
      reading,
      hasData,
      weightKg,
      tempC,
      humidityPercent,
      pressureHpa,
      bleBatteryPercent,
      sensorSummary: sensors.length ? sensors.join(', ') : 'no sensors',
    };
  });
};

const filterMeasurementsByDateRange = (
  measurements: HiveScaleMeasurement[] | undefined,
  dateRange: HiveScaleDateRange,
) => {
  const startMs = dateRange.startAt
    ? new Date(dateRange.startAt).getTime()
    : Number.NEGATIVE_INFINITY;
  const endMs = dateRange.endAt
    ? new Date(dateRange.endAt).getTime()
    : Number.POSITIVE_INFINITY;

  return [...(measurements ?? [])]
    .sort(
      (a, b) =>
        new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime(),
    )
    .filter(measurement => {
      const ts = new Date(measurement.measured_at).getTime();
      return Number.isFinite(ts) && ts >= startMs && ts <= endMs;
    });
};

const seriesKey = (hiveIndex: number, metric: HiveMetricKey) =>
  `hive${hiveIndex}_${metric}`;

const buildHiveMetricChartRows = ({
  measurements,
  dateRange,
  fallbackNames,
  hiveIndexes,
  metrics,
}: {
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  metrics: HiveMetricKey[];
}): ChartRow[] =>
  filterMeasurementsByDateRange(measurements, dateRange).map(measurement => {
    const hiveMap = new Map(
      measurementHiveReadings(measurement, fallbackNames).map(hive => [
        hive.index,
        hive,
      ]),
    );
    const row: ChartRow = {
      timestamp: new Date(measurement.measured_at).getTime(),
      measuredAt: measurement.measured_at,
    };

    for (const hiveIndex of hiveIndexes) {
      const hive = hiveMap.get(hiveIndex) ?? null;
      for (const metric of metrics) {
        row[seriesKey(hiveIndex, metric)] = hiveMetricValue(hive, metric);
      }
    }

    return row;
  });

const latestMeasurement = (measurements: HiveScaleMeasurement[] | undefined) => {
  if (!measurements?.length) return undefined;
  return [...measurements].sort(
    (a, b) =>
      new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  )[0];
};

function DateRangeControls({
  dateRange,
  onDateRangeChange,
}: Readonly<{
  dateRange: HiveScaleDateRange;
  onDateRangeChange: (range: HiveScaleDateRange) => void;
}>) {
  const presetLabel = (preset: HiveScaleDateRangePreset) => {
    if (preset === 'currentYear') return new Date().getFullYear().toString();
    if (preset === 'all') return 'All';
    return preset;
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {dateRangePresets.map(preset => (
        <Button
          key={preset}
          type="button"
          size="sm"
          variant={
            dateRange.preset === preset
              ? 'default'
              : 'outline'
          }
          onClick={() => onDateRangeChange(createPresetDateRange(preset))}
        >
          {presetLabel(preset)}
        </Button>
      ))}
    </div>
  );
}

function HealthMetric({
  title,
  value,
  detail,
  icon,
}: Readonly<{
  title: string;
  value: ReactNode;
  detail: string;
  icon: ReactNode;
}>) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-full bg-muted p-2">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DeviceHealthStrip({
  selectedDevice,
  latest,
  slots,
  alertCount,
  isBatteryCharging,
}: Readonly<{
  selectedDevice: HiveScaleDevice;
  latest: HiveScaleMeasurement | undefined;
  slots: HiveSlot[];
  alertCount: number;
  isBatteryCharging: boolean;
}>) {
  const hivesWithData = slots.filter(slot => slot.hasData).length;
  const storageOk = [latest?.sd_ok, latest?.rtc_ok, latest?.sht_ok].filter(
    value => value === true,
  ).length;
  const solarPower = latest?.solar_power_mw;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <HealthMetric
        title="Last data"
        value={formatRelativeTime(latest?.measured_at)}
        detail={formatDateTime(latest?.measured_at)}
        icon={<Clock className="h-4 w-4" />}
      />
      <HealthMetric
        title="Hives online"
        value={`${hivesWithData}/${MAX_HIVE_SLOTS}`}
        detail="slots with recent readings"
        icon={<Activity className="h-4 w-4" />}
      />
      <HealthMetric
        title="Battery"
        value={
          <span className="inline-flex items-center gap-1">
            {numberOrDash(latest?.battery_soc_percent, 0)}%
            {isBatteryCharging && <Zap className="h-4 w-4" />}
          </span>
        }
        detail={isBatteryCharging ? 'charging' : 'state of charge'}
        icon={<Battery className="h-4 w-4" />}
      />
      <HealthMetric
        title="Solar"
        value={
          solarPower === null || solarPower === undefined
            ? `${numberOrDash(latest?.solar_load_voltage_v, 2)} V`
            : `${numberOrDash(solarPower, 0)} mW`
        }
        detail="input power"
        icon={<Zap className="h-4 w-4" />}
      />
      <HealthMetric
        title="Firmware"
        value={selectedDevice.last_firmware_version ?? latest?.firmware_version ?? '--'}
        detail={`last seen ${formatRelativeTime(selectedDevice.last_seen_at)}`}
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <HealthMetric
        title="Insights"
        value={alertCount > 0 ? `${alertCount} active` : 'All clear'}
        detail={`device checks ${storageOk}/3 ok`}
        icon={<Info className="h-4 w-4" />}
      />
    </div>
  );
}

function HiveOverviewGrid({
  slots,
  selectedHiveIndexes,
  onToggleHive,
  alertsByHive,
}: Readonly<{
  slots: HiveSlot[];
  selectedHiveIndexes: number[];
  onToggleHive: (index: number) => void;
  alertsByHive: Record<number, HiveScaleInsightAlert[]>;
}>) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Hive overview</CardTitle>
            <CardDescription>
              Compact status for up to 18 hives. Select tiles to drive the
              dashboard widgets below.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {selectedHiveIndexes.length || 0} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {slots.map(slot => {
            const selected = selectedHiveIndexes.includes(slot.index);
            const alerts = alertsByHive[slot.index] ?? [];
            return (
              <button
                key={slot.index}
                type="button"
                onClick={() => onToggleHive(slot.index)}
                className={`rounded-lg border p-3 text-left transition hover:border-primary ${
                  selected ? 'border-primary bg-primary/5' : 'bg-card'
                } ${slot.hasData ? '' : 'opacity-70'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{slot.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Slot {slot.index}
                    </p>
                  </div>
                  {alerts.length > 0 ? (
                    <Badge variant="destructive" className="shrink-0 text-[10px]">
                      {alerts.length}
                    </Badge>
                  ) : slot.hasData ? (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      OK
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      No data
                    </Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-semibold">{numberOrDash(slot.weightKg)} kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Temp</p>
                    <p className="font-semibold">{numberOrDash(slot.tempC)} C</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">RH</p>
                    <p className="font-semibold">
                      {numberOrDash(slot.humidityPercent, 0)}%
                    </p>
                  </div>
                </div>
                <p className="mt-3 truncate text-xs text-muted-foreground">
                  {slot.sensorSummary}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function WidgetShell({
  title,
  description,
  size,
  onRemove,
  children,
}: Readonly<{
  title: string;
  description: string;
  size: DashboardWidgetSize;
  onRemove: () => void;
  children: ReactNode;
}>) {
  return (
    <Card className={size === 'wide' ? 'xl:col-span-2' : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={onRemove}
            aria-label={`Remove ${title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyWidgetState({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      <Activity className="mr-2 h-4 w-4" />
      {label}
    </div>
  );
}

function HiveLineChart({
  rows,
  hiveIndexes,
  metric,
  hiveNames,
  unit,
  heightClass = 'h-72',
}: Readonly<{
  rows: ChartRow[];
  hiveIndexes: number[];
  metric: HiveMetricKey;
  hiveNames: Record<number, string>;
  unit: string;
  heightClass?: string;
}>) {
  const hasData = rows.some(row =>
    hiveIndexes.some(index => typeof row[seriesKey(index, metric)] === 'number'),
  );

  if (!rows.length || !hasData) {
    return <EmptyWidgetState label="No data for the selected hives and range." />;
  }

  return (
    <div className={heightClass}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            minTickGap={32}
            scale="time"
            tickFormatter={formatChartTick}
            type="number"
          />
          <YAxis unit={` ${unit}`} width={64} domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={(value: unknown) => formatDateTime(Number(value))}
            formatter={(value: unknown, name: unknown) => [
              typeof value === 'number' ? `${value.toFixed(1)} ${unit}` : '--',
              String(name),
            ]}
          />
          <Legend />
          {hiveIndexes.map((index, i) => (
            <Line
              key={index}
              type="monotone"
              dataKey={seriesKey(index, metric)}
              name={hiveNames[index] ?? `Hive ${index}`}
              stroke={chartColors[i % chartColors.length]}
              dot={false}
              connectNulls={false}
              strokeWidth={1.6}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeightComparisonWidget({
  measurements,
  dateRange,
  fallbackNames,
  hiveIndexes,
  hiveNames,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  hiveNames: Record<number, string>;
}>) {
  const rows = useMemo(
    () =>
      buildHiveMetricChartRows({
        measurements,
        dateRange,
        fallbackNames,
        hiveIndexes,
        metrics: ['weight'],
      }),
    [dateRange, fallbackNames, hiveIndexes, measurements],
  );

  return (
    <HiveLineChart
      rows={rows}
      hiveIndexes={hiveIndexes}
      metric="weight"
      hiveNames={hiveNames}
      unit="kg"
    />
  );
}

function ClimateWidget({
  measurements,
  dateRange,
  fallbackNames,
  hiveIndexes,
  hiveNames,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  hiveNames: Record<number, string>;
}>) {
  const visibleHives = useMemo(() => hiveIndexes.slice(0, 4), [hiveIndexes]);
  const rows = useMemo(
    () =>
      buildHiveMetricChartRows({
        measurements,
        dateRange,
        fallbackNames,
        hiveIndexes: visibleHives,
        metrics: ['temperature', 'humidity'],
      }),
    [dateRange, fallbackNames, measurements, visibleHives],
  );
  const hasData = rows.some(row =>
    visibleHives.some(
      index =>
        typeof row[seriesKey(index, 'temperature')] === 'number' ||
        typeof row[seriesKey(index, 'humidity')] === 'number',
    ),
  );

  if (!rows.length || !hasData) {
    return <EmptyWidgetState label="No climate data for the selected range." />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            minTickGap={32}
            scale="time"
            tickFormatter={formatChartTick}
            type="number"
          />
          <YAxis yAxisId="temperature" unit=" C" width={56} domain={['auto', 'auto']} />
          <YAxis
            yAxisId="humidity"
            orientation="right"
            unit=" %"
            width={48}
            domain={[0, 100]}
          />
          <Tooltip labelFormatter={(value: unknown) => formatDateTime(Number(value))} />
          <Legend />
          {visibleHives.map((index, i) => (
            <Line
              key={`${index}-temp`}
              yAxisId="temperature"
              type="monotone"
              dataKey={seriesKey(index, 'temperature')}
              name={`${hiveNames[index] ?? `Hive ${index}`} temp`}
              stroke={chartColors[i % chartColors.length]}
              dot={false}
              connectNulls={false}
              strokeWidth={1.6}
              isAnimationActive={false}
            />
          ))}
          {visibleHives.map((index, i) => (
            <Line
              key={`${index}-humidity`}
              yAxisId="humidity"
              type="monotone"
              dataKey={seriesKey(index, 'humidity')}
              name={`${hiveNames[index] ?? `Hive ${index}`} RH`}
              stroke={chartColors[(i + 3) % chartColors.length]}
              strokeDasharray="4 2"
              dot={false}
              connectNulls={false}
              strokeWidth={1.4}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PowerWidget({
  measurements,
  dateRange,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
}>) {
  const rows = useMemo(
    () =>
      filterMeasurementsByDateRange(measurements, dateRange).map(measurement => ({
        timestamp: new Date(measurement.measured_at).getTime(),
        measuredAt: measurement.measured_at,
        batterySoc: deviceMetricValue(measurement, 'batterySoc'),
        batteryVoltage: deviceMetricValue(measurement, 'batteryVoltage'),
        solarPower: deviceMetricValue(measurement, 'solarPower'),
      })),
    [dateRange, measurements],
  );
  const hasData = rows.some(
    row =>
      typeof row.batterySoc === 'number' ||
      typeof row.batteryVoltage === 'number' ||
      typeof row.solarPower === 'number',
  );

  if (!rows.length || !hasData) {
    return <EmptyWidgetState label="No power data for the selected range." />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            minTickGap={32}
            scale="time"
            tickFormatter={formatChartTick}
            type="number"
          />
          <YAxis yAxisId="percent" unit=" %" width={48} domain={[0, 'auto']} />
          <YAxis
            yAxisId="voltage"
            orientation="right"
            unit=" V"
            width={48}
            domain={['auto', 'auto']}
          />
          <Tooltip labelFormatter={(value: unknown) => formatDateTime(Number(value))} />
          <Legend />
          <Line
            yAxisId="percent"
            type="monotone"
            dataKey="batterySoc"
            name="Battery charge"
            stroke="var(--primary)"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="voltage"
            type="monotone"
            dataKey="batteryVoltage"
            name="Battery voltage"
            stroke="var(--chart-2)"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="voltage"
            type="monotone"
            dataKey="solarPower"
            name="Solar power (mW)"
            stroke="var(--chart-3)"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BeeTrafficWidget({
  measurements,
  dateRange,
  fallbackNames,
  hiveIndexes,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
}>) {
  const rows = useMemo(
    () =>
      filterMeasurementsByDateRange(measurements, dateRange).map(measurement => {
        const hiveMap = new Map(
          measurementHiveReadings(measurement, fallbackNames).map(hive => [
            hive.index,
            hive,
          ]),
        );
        let inCount = 0;
        let outCount = 0;
        let hasCounter = false;
        for (const index of hiveIndexes) {
          const hive = hiveMap.get(index) ?? null;
          const inValue = hiveMetricValue(hive, 'beeIn');
          const outValue = hiveMetricValue(hive, 'beeOut');
          if (inValue !== null || outValue !== null) hasCounter = true;
          inCount += inValue ?? 0;
          outCount += outValue ?? 0;
        }
        return {
          timestamp: new Date(measurement.measured_at).getTime(),
          measuredAt: measurement.measured_at,
          inCount: hasCounter ? inCount : null,
          outCount: hasCounter ? outCount : null,
          net: hasCounter ? inCount - outCount : null,
        };
      }),
    [dateRange, fallbackNames, hiveIndexes, measurements],
  );
  const hasData = rows.some(
    row => typeof row.inCount === 'number' || typeof row.outCount === 'number',
  );

  if (!rows.length || !hasData) {
    return <EmptyWidgetState label="No bee counter data for the selected hives." />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            minTickGap={32}
            scale="time"
            tickFormatter={formatChartTick}
            type="number"
          />
          <YAxis width={56} />
          <Tooltip labelFormatter={(value: unknown) => formatDateTime(Number(value))} />
          <Legend />
          <Bar dataKey="inCount" name="In" fill="var(--chart-3)" />
          <Bar dataKey="outCount" name="Out" fill="var(--chart-4)" />
          <Line
            type="monotone"
            dataKey="net"
            name="Net"
            stroke="var(--primary)"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SoundRmsWidget({
  measurements,
  dateRange,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
}>) {
  const rows = useMemo(
    () =>
      filterMeasurementsByDateRange(measurements, dateRange).map(measurement => ({
        timestamp: new Date(measurement.measured_at).getTime(),
        measuredAt: measurement.measured_at,
        left: toFiniteNumber(measurement.mic_left_rms_dbfs),
        right: toFiniteNumber(measurement.mic_right_rms_dbfs),
      })),
    [dateRange, measurements],
  );
  const hasData = rows.some(
    row => typeof row.left === 'number' || typeof row.right === 'number',
  );

  if (!rows.length || !hasData) {
    return <EmptyWidgetState label="No stereo microphone data for this range." />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            minTickGap={32}
            scale="time"
            tickFormatter={formatChartTick}
            type="number"
          />
          <YAxis unit=" dBFS" width={68} domain={['auto', 'auto']} />
          <Tooltip labelFormatter={(value: unknown) => formatDateTime(Number(value))} />
          <Legend />
          <Line
            type="monotone"
            dataKey="left"
            name="Left channel"
            stroke="var(--chart-1)"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="right"
            name="Right channel"
            stroke="var(--chart-2)"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function VibrationWidget({
  measurements,
  dateRange,
  fallbackNames,
  hiveIndexes,
  hiveNames,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  hiveNames: Record<number, string>;
}>) {
  const rows = useMemo(
    () =>
      buildHiveMetricChartRows({
        measurements,
        dateRange,
        fallbackNames,
        hiveIndexes,
        metrics: ['vibration'],
      }),
    [dateRange, fallbackNames, hiveIndexes, measurements],
  );

  return (
    <HiveLineChart
      rows={rows}
      hiveIndexes={hiveIndexes}
      metric="vibration"
      hiveNames={hiveNames}
      unit="mg"
    />
  );
}

function TemperatureHeatmapWidget({ slots }: Readonly<{ slots: HiveSlot[] }>) {
  const temps = slots
    .map(slot => slot.tempC)
    .filter((value): value is number => typeof value === 'number');
  const min = temps.length ? Math.min(...temps) : 0;
  const max = temps.length ? Math.max(...temps) : 1;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {slots.map(slot => {
          const normalized =
            slot.tempC === null || max === min
              ? 0
              : Math.max(0, Math.min(1, (slot.tempC - min) / (max - min)));
          return (
            <div key={slot.index} className="rounded-md border p-2">
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium">{slot.name}</span>
                <span className="text-muted-foreground">
                  {numberOrDash(slot.tempC)} C
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${slot.tempC === null ? 0 : 20 + normalized * 80}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Uses latest visible reading per hive. Empty bars indicate missing
        temperature data.
      </p>
    </div>
  );
}

function InsightsWidget({
  alerts,
  hiveNames,
  isLoading,
  isError,
}: Readonly<{
  alerts: HiveScaleInsightAlert[];
  hiveNames: Record<number, string>;
  isLoading: boolean;
  isError: boolean;
}>) {
  if (isLoading) return <EmptyWidgetState label="Loading insights..." />;
  if (isError) return <EmptyWidgetState label="Insights are unavailable." />;
  if (!alerts.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        <CheckCircle2 className="mr-2 h-4 w-4" />
        No active alerts for this device.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.slice(0, 6).map(alert => (
        <div key={alert.id} className="rounded-md border p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="text-xs text-muted-foreground">
                {hiveNames[alert.channel] ?? `Hive ${alert.channel}`} ·{' '}
                {alert.category} · confidence {Math.round(alert.confidence * 100)}%
              </p>
            </div>
            <Badge
              variant={
                alert.severity === 'critical' || alert.severity === 'warning'
                  ? 'destructive'
                  : 'outline'
              }
              className="shrink-0"
            >
              {alert.severity}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {alert.description}
          </p>
        </div>
      ))}
      {alerts.length > 6 && (
        <p className="text-xs text-muted-foreground">
          +{alerts.length - 6} more active alerts
        </p>
      )}
    </div>
  );
}

function DataQualityWidget({ slots }: Readonly<{ slots: HiveSlot[] }>) {
  const missingScale = slots.filter(slot => slot.hasData && slot.weightKg === null);
  const missingClimate = slots.filter(
    slot => slot.hasData && slot.tempC === null && slot.humidityPercent === null,
  );
  const active = slots.filter(slot => slot.hasData);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Active slots</p>
          <p className="text-2xl font-semibold">{active.length}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">No scale</p>
          <p className="text-2xl font-semibold">{missingScale.length}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">No climate</p>
          <p className="text-2xl font-semibold">{missingClimate.length}</p>
        </div>
      </div>
      <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
        {slots.map(slot => (
          <div
            key={slot.index}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <span className="truncate">{slot.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {slot.hasData ? slot.sensorSummary : 'no recent data'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddWidgetPanel({
  onAddWidget,
}: Readonly<{ onAddWidget: (kind: DashboardWidgetKind) => void }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add widget</CardTitle>
        <CardDescription>
          Start from a template. The widget will use the selected hives from the
          overview grid where applicable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.values(widgetTemplates).map(template => {
            const Icon = template.Icon;
            return (
              <button
                key={template.kind}
                type="button"
                onClick={() => onAddWidget(template.kind)}
                className="rounded-lg border p-3 text-left transition hover:border-primary hover:bg-muted/50"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-full bg-muted p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="font-medium">{template.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function renderWidget({
  widget,
  measurements,
  dateRange,
  fallbackNames,
  selectedHiveIndexes,
  hiveNames,
  slots,
  alerts,
  insightsLoading,
  insightsError,
}: {
  widget: DashboardWidget;
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  selectedHiveIndexes: number[];
  hiveNames: Record<number, string>;
  slots: HiveSlot[];
  alerts: HiveScaleInsightAlert[];
  insightsLoading: boolean;
  insightsError: boolean;
}) {
  const activeHiveIndexes = selectedHiveIndexes.length
    ? selectedHiveIndexes.slice(0, 8)
    : slots
        .filter(slot => slot.hasData)
        .slice(0, 4)
        .map(slot => slot.index);

  switch (widget.kind) {
    case 'weightComparison':
      return (
        <WeightComparisonWidget
          measurements={measurements}
          dateRange={dateRange}
          fallbackNames={fallbackNames}
          hiveIndexes={activeHiveIndexes}
          hiveNames={hiveNames}
        />
      );
    case 'climate':
      return (
        <ClimateWidget
          measurements={measurements}
          dateRange={dateRange}
          fallbackNames={fallbackNames}
          hiveIndexes={activeHiveIndexes}
          hiveNames={hiveNames}
        />
      );
    case 'power':
      return <PowerWidget measurements={measurements} dateRange={dateRange} />;
    case 'beeTraffic':
      return (
        <BeeTrafficWidget
          measurements={measurements}
          dateRange={dateRange}
          fallbackNames={fallbackNames}
          hiveIndexes={activeHiveIndexes}
        />
      );
    case 'soundRms':
      return <SoundRmsWidget measurements={measurements} dateRange={dateRange} />;
    case 'vibration':
      return (
        <VibrationWidget
          measurements={measurements}
          dateRange={dateRange}
          fallbackNames={fallbackNames}
          hiveIndexes={activeHiveIndexes}
          hiveNames={hiveNames}
        />
      );
    case 'temperatureHeatmap':
      return <TemperatureHeatmapWidget slots={slots} />;
    case 'insights':
      return (
        <InsightsWidget
          alerts={alerts}
          hiveNames={hiveNames}
          isLoading={insightsLoading}
          isError={insightsError}
        />
      );
    case 'dataQuality':
      return <DataQualityWidget slots={slots} />;
    default:
      return <EmptyWidgetState label="Unknown widget type." />;
  }
}

export function HiveScaleModularDashboard({
  selectedDevice,
  measurements,
  dateRange,
  onDateRangeChange,
  scale1Name,
  scale2Name,
  alerts,
  insightsLoading,
  insightsError,
  isBatteryCharging,
}: Readonly<{
  selectedDevice: HiveScaleDevice;
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  onDateRangeChange: (range: HiveScaleDateRange) => void;
  scale1Name: string;
  scale2Name: string;
  alerts: HiveScaleInsightAlert[];
  insightsLoading: boolean;
  insightsError: boolean;
  isBatteryCharging: boolean;
}>) {
  const fallbackNames = useMemo(
    () => ({ scale1Name, scale2Name }),
    [scale1Name, scale2Name],
  );
  const latest = useMemo(() => latestMeasurement(measurements), [measurements]);
  const slots = useMemo(
    () => buildHiveSlots(latest, fallbackNames),
    [fallbackNames, latest],
  );
  const hiveNames = useMemo(
    () =>
      Object.fromEntries(slots.map(slot => [slot.index, slot.name])) as Record<
        number,
        string
      >,
    [slots],
  );
  const availableHiveIndexes = useMemo(
    () => slots.filter(slot => slot.hasData).map(slot => slot.index),
    [slots],
  );
  const [selectedHiveIndexes, setSelectedHiveIndexes] = useState<number[]>([]);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() =>
    loadDashboardSettings(selectedDevice.device_id),
  );
  const [showAddWidget, setShowAddWidget] = useState(false);

  useEffect(() => {
    setWidgets(loadDashboardSettings(selectedDevice.device_id));
    setSelectedHiveIndexes([]);
  }, [selectedDevice.device_id]);

  useEffect(() => {
    setSelectedHiveIndexes(current =>
      current.length ? current : availableHiveIndexes.slice(0, 4),
    );
  }, [availableHiveIndexes]);

  useEffect(() => {
    saveDashboardSettings(selectedDevice.device_id, widgets);
  }, [selectedDevice.device_id, widgets]);

  const alertsByHive = useMemo(() => {
    const grouped: Record<number, HiveScaleInsightAlert[]> = {};
    for (const alert of alerts) {
      grouped[alert.channel] = [...(grouped[alert.channel] ?? []), alert];
    }
    return grouped;
  }, [alerts]);

  const toggleHive = (index: number) => {
    setSelectedHiveIndexes(current =>
      current.includes(index)
        ? current.filter(item => item !== index)
        : [...current, index].sort((a, b) => a - b),
    );
  };

  const addWidget = (kind: DashboardWidgetKind) => {
    const template = widgetTemplates[kind];
    setWidgets(current => [
      ...current,
      {
        id: createWidgetId(kind),
        kind,
        title: template.title,
        size: template.size,
      },
    ]);
    setShowAddWidget(false);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(current => current.filter(widget => widget.id !== widgetId));
  };

  const resetDashboard = () => {
    setWidgets(defaultWidgets);
  };

  return (
    <div className="space-y-4">
      <DeviceHealthStrip
        selectedDevice={selectedDevice}
        latest={latest}
        slots={slots}
        alertCount={alerts.length}
        isBatteryCharging={isBatteryCharging}
      />

      <HiveOverviewGrid
        slots={slots}
        selectedHiveIndexes={selectedHiveIndexes}
        onToggleHive={toggleHive}
        alertsByHive={alertsByHive}
      />

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">My dashboard</h2>
          <p className="text-sm text-muted-foreground">
            User-configurable widgets. The selected hives above control hive-based
            charts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeControls
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddWidget(open => !open)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add widget
          </Button>
          <Button type="button" variant="ghost" onClick={resetDashboard}>
            Reset
          </Button>
        </div>
      </div>

      {showAddWidget && <AddWidgetPanel onAddWidget={addWidget} />}

      {widgets.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {widgets.map(widget => (
            <WidgetShell
              key={widget.id}
              title={widget.title}
              description={widgetTemplates[widget.kind].description}
              size={widget.size}
              onRemove={() => removeWidget(widget.id)}
            >
              {renderWidget({
                widget,
                measurements,
                dateRange,
                fallbackNames,
                selectedHiveIndexes,
                hiveNames,
                slots,
                alerts,
                insightsLoading,
                insightsError,
              })}
            </WidgetShell>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <Info className="h-5 w-5" />
            No widgets yet. Add a template to build your dashboard.
            <Button type="button" variant="outline" onClick={resetDashboard}>
              Restore defaults
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
