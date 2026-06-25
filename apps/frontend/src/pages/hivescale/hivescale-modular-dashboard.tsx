import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  Activity,
  Battery,
  CheckCircle2,
  ChevronDown,
  Download,
  Info,
  Plus,
  Thermometer,
  Trash2,
  Weight,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { severityConfig } from './hivescale-insights-card';
import { HiveScaleInsightsHistoryDialog } from './hivescale-insights-history-dialog';

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

const resolveDateRangeBounds = (
  dateRange: HiveScaleDateRange,
): ResolvedDateRangeBounds => {
  if (dateRange.preset === 'all') return {};

  const effectiveRange =
    dateRange.preset === 'custom'
      ? dateRange
      : createPresetDateRange(dateRange.preset);
  const startMs = effectiveRange.startAt
    ? new Date(effectiveRange.startAt).getTime()
    : undefined;
  const explicitEndMs = effectiveRange.endAt
    ? new Date(effectiveRange.endAt).getTime()
    : undefined;

  return {
    startMs:
      startMs !== undefined && Number.isFinite(startMs) ? startMs : undefined,
    // Preset ranges should always mean "from now backwards", never an open
    // future range. Custom ranges keep their explicit end when one is set.
    endMs:
      dateRange.preset === 'custom'
        ? explicitEndMs !== undefined && Number.isFinite(explicitEndMs)
          ? explicitEndMs
          : Date.now()
        : Date.now(),
  };
};

const chartDomainForDateRange = (
  dateRange: HiveScaleDateRange,
): [number | 'dataMin', number | 'dataMax'] => {
  const { startMs, endMs } = resolveDateRangeBounds(dateRange);
  return [startMs ?? 'dataMin', endMs ?? 'dataMax'];
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

type SoundMetricKey =
  | 'rmsDbfs'
  | 'subBass'
  | 'hum'
  | 'piping'
  | 'stress'
  | 'high'
  | 'hiveHeartFrequency'
  | 'hiveHeartEnergy'
  | 'hiveHeartPeak';

type DeviceMetricKey = 'batterySoc' | 'batteryVoltage' | 'solarPower';

type DashboardWidgetKind =
  | 'weightComparison'
  | 'climate'
  | 'power'
  | 'beeTraffic'
  | 'soundRms'
  | 'vibration'
  | 'configurableDiagram'
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

type MappedHiveNames = Record<number, string>;

type ResolvedDateRangeBounds = {
  startMs?: number;
  endMs?: number;
};

type AxisBound = number | 'auto';
type AxisDomain = [AxisBound, AxisBound];
type AxisScaleSetting = { min: string; max: string };
type AxisScaleSettingsMap = Record<string, AxisScaleSetting>;
type AxisScaleDefinition = { id: string; label: string; unit?: string };
type CsvColumn = { header: string; value: (row: ChartRow) => unknown };

const chartColors = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--muted-foreground)',
];

const escapeCsvField = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const downloadChartCsv = (
  filename: string,
  rows: ChartRow[],
  columns: CsvColumn[],
) => {
  if (!rows.length || !columns.length || typeof document === 'undefined') return;

  const header = ['measured_at', 'timestamp', ...columns.map(column => column.header)];
  const csvRows = rows.map(row =>
    [
      row.measuredAt,
      new Date(Number(row.timestamp)).toISOString(),
      ...columns.map(column => column.value(row)),
    ]
      .map(escapeCsvField)
      .join(','),
  );
  const blob = new Blob([[header.map(escapeCsvField).join(','), ...csvRows].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const parseAxisBound = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const axisDomain = (
  settings: AxisScaleSettingsMap,
  axisId: string,
  fallback: AxisDomain,
): AxisDomain => {
  const setting = settings[axisId];
  if (!setting) return fallback;
  return [
    parseAxisBound(setting.min) ?? fallback[0],
    parseAxisBound(setting.max) ?? fallback[1],
  ];
};

const axisBoundLabel = (value: string | undefined) =>
  value?.trim() ? value.trim() : 'auto';

function AxisScaleControls({
  axes,
  settings,
  onSettingsChange,
}: Readonly<{
  axes: AxisScaleDefinition[];
  settings: AxisScaleSettingsMap;
  onSettingsChange: Dispatch<SetStateAction<AxisScaleSettingsMap>>;
}>) {
  const updateBound = (axisId: string, bound: keyof AxisScaleSetting) => {
    const current = settings[axisId]?.[bound] ?? '';
    const next = globalThis.prompt?.(
      `Set ${axisId} y_${bound}. Leave empty for auto.`,
      current,
    );
    if (next === undefined || next === null) return;
    const trimmed = next.trim();
    if (trimmed && !Number.isFinite(Number(trimmed))) {
      globalThis.alert?.('Please enter a valid number, or leave the field empty for auto.');
      return;
    }
    onSettingsChange(existing => ({
      ...existing,
      [axisId]: {
        min: existing[axisId]?.min ?? '',
        max: existing[axisId]?.max ?? '',
        [bound]: trimmed,
      },
    }));
  };

  const resetAxis = (axisId: string) => {
    onSettingsChange(existing => {
      const next = { ...existing };
      delete next[axisId];
      return next;
    });
  };

  if (!axes.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {axes.map(axis => {
        const setting = settings[axis.id];
        return (
          <div
            key={axis.id}
            className="flex flex-wrap items-center gap-1 rounded-md border px-2 py-1"
          >
            <span className="font-medium">
              {axis.label}
              {axis.unit ? ` (${axis.unit})` : ''}
            </span>
            <button
              type="button"
              className="rounded border px-1.5 py-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => updateBound(axis.id, 'min')}
            >
              y_min: {axisBoundLabel(setting?.min)}
            </button>
            <button
              type="button"
              className="rounded border px-1.5 py-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => updateBound(axis.id, 'max')}
            >
              y_max: {axisBoundLabel(setting?.max)}
            </button>
            {(setting?.min || setting?.max) && (
              <button
                type="button"
                className="rounded border px-1.5 py-0.5 text-muted-foreground hover:text-foreground"
                onClick={() => resetAxis(axis.id)}
              >
                reset
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChartControls({
  csvFilename,
  csvRows,
  csvColumns,
  axes,
  axisScales,
  onAxisScalesChange,
}: Readonly<{
  csvFilename: string;
  csvRows: ChartRow[];
  csvColumns: CsvColumn[];
  axes: AxisScaleDefinition[];
  axisScales: AxisScaleSettingsMap;
  onAxisScalesChange: Dispatch<SetStateAction<AxisScaleSettingsMap>>;
}>) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <AxisScaleControls
        axes={axes}
        settings={axisScales}
        onSettingsChange={onAxisScalesChange}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => downloadChartCsv(csvFilename, csvRows, csvColumns)}
        disabled={!csvRows.length || !csvColumns.length}
      >
        <Download className="mr-1 h-3.5 w-3.5" />
        Download CSV
      </Button>
    </div>
  );
}

const dateRangePresets = [
  '24h',
  '7d',
  '30d',
  '365d',
  'currentYear',
  'all',
] as const satisfies readonly HiveScaleDateRangePreset[];


type ConfigurableMetricAxis =
  | 'weight'
  | 'temperature'
  | 'humidity'
  | 'pressure'
  | 'beecount'
  | 'vibration'
  | 'dbfs'
  | 'frequency'
  | 'energy'
  | 'percent'
  | 'voltage'
  | 'power';

type ConfigurableMetricDefinition = {
  key: string;
  label: string;
  unit: string;
  axis: ConfigurableMetricAxis;
  group: string;
} & (
  | { source: 'hive'; hiveMetric: HiveMetricKey }
  | { source: 'sound'; soundMetric: SoundMetricKey }
  | { source: 'device'; deviceMetric: DeviceMetricKey }
);

const configurableMetricAxes: Record<
  ConfigurableMetricAxis,
  { unit: string; width: number; orientation: 'left' | 'right' }
> = {
  weight: { unit: 'kg', width: 54, orientation: 'left' },
  temperature: { unit: '°C', width: 54, orientation: 'right' },
  humidity: { unit: '%', width: 46, orientation: 'right' },
  pressure: { unit: 'hPa', width: 68, orientation: 'right' },
  beecount: { unit: 'bees', width: 58, orientation: 'right' },
  vibration: { unit: 'mg', width: 54, orientation: 'right' },
  dbfs: { unit: 'dBFS', width: 66, orientation: 'right' },
  frequency: { unit: 'Hz', width: 58, orientation: 'right' },
  energy: { unit: '', width: 50, orientation: 'right' },
  percent: { unit: '%', width: 46, orientation: 'right' },
  voltage: { unit: 'V', width: 46, orientation: 'right' },
  power: { unit: 'mW', width: 58, orientation: 'right' },
};

const configurableMetrics: ConfigurableMetricDefinition[] = [
  {
    key: 'weight',
    label: 'Weight',
    unit: 'kg',
    axis: 'weight',
    group: 'Scale',
    source: 'hive',
    hiveMetric: 'weight',
  },
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    axis: 'temperature',
    group: 'Climate',
    source: 'hive',
    hiveMetric: 'temperature',
  },
  {
    key: 'humidity',
    label: 'Humidity',
    unit: '%',
    axis: 'humidity',
    group: 'Climate',
    source: 'hive',
    hiveMetric: 'humidity',
  },
  {
    key: 'pressure',
    label: 'Pressure',
    unit: 'hPa',
    axis: 'pressure',
    group: 'Climate',
    source: 'hive',
    hiveMetric: 'pressure',
  },
  {
    key: 'beeIn',
    label: 'Bees in',
    unit: 'bees',
    axis: 'beecount',
    group: 'Bee traffic',
    source: 'hive',
    hiveMetric: 'beeIn',
  },
  {
    key: 'beeOut',
    label: 'Bees out',
    unit: 'bees',
    axis: 'beecount',
    group: 'Bee traffic',
    source: 'hive',
    hiveMetric: 'beeOut',
  },
  {
    key: 'beeNet',
    label: 'Net flow',
    unit: 'bees',
    axis: 'beecount',
    group: 'Bee traffic',
    source: 'hive',
    hiveMetric: 'beeNet',
  },
  {
    key: 'vibration',
    label: 'Vibration RMS',
    unit: 'mg',
    axis: 'vibration',
    group: 'Vibration',
    source: 'hive',
    hiveMetric: 'vibration',
  },
  {
    key: 'swarmBand',
    label: 'Swarm band',
    unit: 'mg',
    axis: 'vibration',
    group: 'Vibration',
    source: 'hive',
    hiveMetric: 'swarmBand',
  },
  {
    key: 'fanningBand',
    label: 'Fanning band',
    unit: 'mg',
    axis: 'vibration',
    group: 'Vibration',
    source: 'hive',
    hiveMetric: 'fanningBand',
  },
  {
    key: 'activityBand',
    label: 'Activity band',
    unit: 'mg',
    axis: 'vibration',
    group: 'Vibration',
    source: 'hive',
    hiveMetric: 'activityBand',
  },
  {
    key: 'soundRms',
    label: 'Sound RMS',
    unit: 'dBFS',
    axis: 'dbfs',
    group: 'Sound',
    source: 'sound',
    soundMetric: 'rmsDbfs',
  },
  {
    key: 'soundHum',
    label: 'Hum band',
    unit: 'dBFS',
    axis: 'dbfs',
    group: 'Sound',
    source: 'sound',
    soundMetric: 'hum',
  },
  {
    key: 'soundPiping',
    label: 'Piping band',
    unit: 'dBFS',
    axis: 'dbfs',
    group: 'Sound',
    source: 'sound',
    soundMetric: 'piping',
  },
  {
    key: 'soundStress',
    label: 'Stress band',
    unit: 'dBFS',
    axis: 'dbfs',
    group: 'Sound',
    source: 'sound',
    soundMetric: 'stress',
  },
  {
    key: 'hiveHeartFrequency',
    label: 'HiveHeart frequency',
    unit: 'Hz',
    axis: 'frequency',
    group: 'Sound',
    source: 'sound',
    soundMetric: 'hiveHeartFrequency',
  },
  {
    key: 'hiveHeartEnergy',
    label: 'HiveHeart energy',
    unit: '',
    axis: 'energy',
    group: 'Sound',
    source: 'sound',
    soundMetric: 'hiveHeartEnergy',
  },
  {
    key: 'batterySoc',
    label: 'Battery charge',
    unit: '%',
    axis: 'percent',
    group: 'Device',
    source: 'device',
    deviceMetric: 'batterySoc',
  },
  {
    key: 'batteryVoltage',
    label: 'Battery voltage',
    unit: 'V',
    axis: 'voltage',
    group: 'Device',
    source: 'device',
    deviceMetric: 'batteryVoltage',
  },
  {
    key: 'solarPower',
    label: 'Solar power',
    unit: 'mW',
    axis: 'power',
    group: 'Device',
    source: 'device',
    deviceMetric: 'solarPower',
  },
];

const configurableMetricsByGroup = configurableMetrics.reduce(
  (groups, metric) => {
    groups[metric.group] = [...(groups[metric.group] ?? []), metric];
    return groups;
  },
  {} as Record<string, ConfigurableMetricDefinition[]>,
);

const defaultConfigurableMetricKeys = [
  'weight',
  'temperature',
  'humidity',
] as const;

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
    title: 'Sound / acoustic bands',
    size: 'half',
    description: 'Per-hive acoustic RMS and FFT/HiveHeart bands when available.',
    Icon: Activity,
  },
  vibration: {
    kind: 'vibration',
    title: 'Vibration bands',
    size: 'half',
    description: 'RMS vibration, swarm, fanning, and activity bands.',
    Icon: Activity,
  },
  configurableDiagram: {
    kind: 'configurableDiagram',
    title: 'Configurable diagram',
    size: 'wide',
    description: 'Choose the hive, sound, traffic, climate, and device metrics to plot.',
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
].map(({ id, kind, title, size }) => ({ id, kind, title, size }));

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


type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' ? (value as UnknownRecord) : null;

const firstFiniteNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const parsed = toFiniteNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
};

const recordValue = (record: UnknownRecord | null, key: string): unknown =>
  record ? record[key] : undefined;

const nestedRecord = (
  record: UnknownRecord | null,
  key: string,
): UnknownRecord | null => asRecord(recordValue(record, key));

const perHiveSoundMetricValue = (
  hive: HiveScaleHiveReading | null,
  metric: SoundMetricKey,
): number | null => {
  if (!hive) return null;

  const hiveRecord = hive as HiveScaleHiveReading & UnknownRecord;
  const sound =
    nestedRecord(hiveRecord, 'sound') ??
    nestedRecord(hiveRecord, 'audio') ??
    nestedRecord(hiveRecord, 'mic') ??
    nestedRecord(hiveRecord, 'acoustic');
  const bands =
    nestedRecord(sound, 'bands') ?? nestedRecord(sound, 'fft_bands') ?? null;
  const hiveHeart =
    nestedRecord(hiveRecord, 'hiveheart') ??
    nestedRecord(hiveRecord, 'hive_heart') ??
    nestedRecord(hiveRecord, 'acoustic_sensor');

  switch (metric) {
    case 'rmsDbfs':
      return firstFiniteNumber(
        recordValue(sound, 'rms_dbfs'),
        recordValue(sound, 'rms_dBFS'),
        recordValue(sound, 'rms'),
        recordValue(hiveHeart, 'rms_dbfs'),
      );
    case 'subBass':
      return firstFiniteNumber(
        recordValue(sound, 'band_sub_bass_dbfs'),
        recordValue(sound, 'sub_bass_dbfs'),
        recordValue(bands, 'sub_bass_dbfs'),
        recordValue(bands, 'sub_bass'),
      );
    case 'hum':
      return firstFiniteNumber(
        recordValue(sound, 'band_hum_dbfs'),
        recordValue(sound, 'hum_dbfs'),
        recordValue(bands, 'hum_dbfs'),
        recordValue(bands, 'hum'),
      );
    case 'piping':
      return firstFiniteNumber(
        recordValue(sound, 'band_piping_dbfs'),
        recordValue(sound, 'piping_dbfs'),
        recordValue(bands, 'piping_dbfs'),
        recordValue(bands, 'piping'),
      );
    case 'stress':
      return firstFiniteNumber(
        recordValue(sound, 'band_stress_dbfs'),
        recordValue(sound, 'stress_dbfs'),
        recordValue(bands, 'stress_dbfs'),
        recordValue(bands, 'stress'),
      );
    case 'high':
      return firstFiniteNumber(
        recordValue(sound, 'band_high_dbfs'),
        recordValue(sound, 'high_dbfs'),
        recordValue(bands, 'high_dbfs'),
        recordValue(bands, 'high'),
      );
    case 'hiveHeartFrequency':
      return firstFiniteNumber(
        recordValue(hiveHeart, 'frequency_hz'),
        recordValue(hiveHeart, 'dominant_frequency_hz'),
        recordValue(sound, 'frequency_hz'),
      );
    case 'hiveHeartEnergy':
      return firstFiniteNumber(
        recordValue(hiveHeart, 'energy'),
        recordValue(sound, 'energy'),
      );
    case 'hiveHeartPeak':
      return firstFiniteNumber(
        recordValue(hiveHeart, 'peak'),
        recordValue(sound, 'peak'),
        recordValue(sound, 'peak_dbfs'),
      );
    default:
      return null;
  }
};

const legacySoundMetricValue = (
  measurement: HiveScaleMeasurement,
  hiveIndex: number,
  metric: SoundMetricKey,
): number | null => {
  if (hiveIndex !== 1 && hiveIndex !== 2) return null;

  const channel = hiveIndex === 1 ? 'left' : 'right';
  const hiveHeartPrefix = hiveIndex === 1 ? 'hiveheart_1' : 'hiveheart_2';
  const measurementRecord = measurement as HiveScaleMeasurement & UnknownRecord;
  const micValue = (suffix: string) =>
    recordValue(measurementRecord, `mic_${channel}_${suffix}`);
  const hiveHeartValue = (suffix: string) =>
    recordValue(measurementRecord, `${hiveHeartPrefix}_${suffix}`);

  switch (metric) {
    case 'rmsDbfs':
      return firstFiniteNumber(micValue('rms_dbfs'));
    case 'subBass':
      return firstFiniteNumber(micValue('band_sub_bass_dbfs'));
    case 'hum':
      return firstFiniteNumber(micValue('band_hum_dbfs'));
    case 'piping':
      return firstFiniteNumber(micValue('band_piping_dbfs'));
    case 'stress':
      return firstFiniteNumber(micValue('band_stress_dbfs'));
    case 'high':
      return firstFiniteNumber(micValue('band_high_dbfs'));
    case 'hiveHeartFrequency':
      return firstFiniteNumber(hiveHeartValue('frequency_hz'));
    case 'hiveHeartEnergy':
      return firstFiniteNumber(hiveHeartValue('energy'));
    case 'hiveHeartPeak':
      return firstFiniteNumber(hiveHeartValue('peak'));
    default:
      return null;
  }
};

const soundMetricValue = (
  measurement: HiveScaleMeasurement,
  hive: HiveScaleHiveReading | null,
  hiveIndex: number,
  metric: SoundMetricKey,
): number | null =>
  perHiveSoundMetricValue(hive, metric) ??
  legacySoundMetricValue(measurement, hiveIndex, metric);

const soundSeriesKey = (hiveIndex: number, metric: SoundMetricKey) =>
  `hive${hiveIndex}_sound_${metric}`;

const configSeriesKey = (hiveIndex: number, metricKey: string) =>
  `cfg_hive${hiveIndex}_${metricKey}`;

const configDeviceSeriesKey = (metricKey: string) => `cfg_device_${metricKey}`;

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
  const { startMs, endMs } = resolveDateRangeBounds(dateRange);

  return [...(measurements ?? [])]
    .sort(
      (a, b) =>
        new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime(),
    )
    .filter(measurement => {
      const ts = new Date(measurement.measured_at).getTime();
      if (!Number.isFinite(ts)) return false;
      if (startMs !== undefined && ts < startMs) return false;
      if (endMs !== undefined && ts > endMs) return false;
      return true;
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


const latestHiveInsideFirmwareSummary = (
  measurements: HiveScaleMeasurement[] | undefined,
  fallbackNames: HiveFallbackNames,
): string => {
  if (!measurements?.length) return '--';
  const versions = new Set<string>();
  const sorted = [...measurements].sort(
    (a, b) =>
      new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  );

  for (const measurement of sorted) {
    for (const value of [
      measurement.ble_1_firmware_version,
      measurement.ble_2_firmware_version,
    ]) {
      if (typeof value === 'string' && value.trim()) {
        versions.add(value.trim());
      }
    }

    for (const hive of measurementHiveReadings(measurement, fallbackNames)) {
      const firmwareVersion = hive.ble?.firmware_version;
      if (typeof firmwareVersion === 'string' && firmwareVersion.trim()) {
        versions.add(firmwareVersion.trim());
      }
    }

    if (versions.size > 0) break;
  }

  return versions.size > 0 ? [...versions].join(' / ') : '--';
};


function HiveOverviewGrid({
  slots,
  selectedHiveIndexes,
  onToggleHive,
  alertsByHive,
  selectedDevice,
  latest,
  hiveInsideFirmware,
}: Readonly<{
  slots: HiveSlot[];
  selectedHiveIndexes: number[];
  onToggleHive: (index: number) => void;
  alertsByHive: Record<number, HiveScaleInsightAlert[]>;
  selectedDevice: HiveScaleDevice;
  latest: HiveScaleMeasurement | undefined;
  hiveInsideFirmware: string;
}>) {
  const [isOpen, setIsOpen] = useState(true);
  const hivesWithData = slots.filter(slot => slot.hasData).length;
  const hivescaleFirmware =
    selectedDevice.last_firmware_version ?? latest?.firmware_version ?? '--';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div>
                <CardTitle>Hive overview</CardTitle>
                <CardDescription>
                  Compact status for mapped hives. Select tiles to drive the
                  dashboard widgets below.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Last data{' '}
                  <span className="font-medium text-foreground">
                    {formatRelativeTime(latest?.measured_at)}
                  </span>
                </span>
                <span>
                  Hives online{' '}
                  <span className="font-medium text-foreground">
                    {hivesWithData}/{slots.length || 0}
                  </span>
                </span>
                <span>
                  HiveScale FW{' '}
                  <span className="font-medium text-foreground">
                    {hivescaleFirmware}
                  </span>
                </span>
                <span>
                  HiveInside FW{' '}
                  <span className="font-medium text-foreground">
                    {hiveInsideFirmware}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selectedHiveIndexes.length} selected</Badge>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  {isOpen ? 'Hide overview' : 'Show overview'}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {slots.length ? (
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
                          <p className="truncate text-sm font-medium">
                            {slot.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Slot {slot.index}
                          </p>
                        </div>
                        {alerts.length > 0 ? (
                          <Badge
                            variant="destructive"
                            className="shrink-0 text-[10px]"
                          >
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
                          <p className="font-semibold">
                            {numberOrDash(slot.weightKg)} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Temp</p>
                          <p className="font-semibold">
                            {numberOrDash(slot.tempC)} °C
                          </p>
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
            ) : (
              <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Map HiveScale slots to HivePal hives in the device setup panel to
                show overview tiles here.
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
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
  dateRange,
  heightClass = 'h-72',
}: Readonly<{
  rows: ChartRow[];
  hiveIndexes: number[];
  metric: HiveMetricKey;
  hiveNames: Record<number, string>;
  unit: string;
  dateRange: HiveScaleDateRange;
  heightClass?: string;
}>) {
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const hasData = rows.some(row =>
    hiveIndexes.some(index => typeof row[seriesKey(index, metric)] === 'number'),
  );
  const csvColumns: CsvColumn[] = hiveIndexes.map(index => ({
    header: `${hiveNames[index] ?? `Hive ${index}`} (${unit})`,
    value: row => row[seriesKey(index, metric)],
  }));

  if (!rows.length || !hasData) {
    return <EmptyWidgetState label="No data for the selected hives and range." />;
  }

  return (
    <div>
      <ChartControls
        csvFilename={`hivescale-${metric}`}
        csvRows={rows}
        csvColumns={csvColumns}
        axes={[{ id: 'main', label: metric, unit }]}
        axisScales={axisScales}
        onAxisScalesChange={setAxisScales}
      />
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
              domain={chartDomainForDateRange(dateRange)}
            />
            <YAxis
              unit={` ${unit}`}
              width={64}
              domain={axisDomain(axisScales, 'main', ['auto', 'auto'])}
            />
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
      dateRange={dateRange}
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
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
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
  const csvColumns: CsvColumn[] = visibleHives.flatMap(index => [
    {
      header: `${hiveNames[index] ?? `Hive ${index}`} temp (°C)`,
      value: row => row[seriesKey(index, 'temperature')],
    },
    {
      header: `${hiveNames[index] ?? `Hive ${index}`} RH (%)`,
      value: row => row[seriesKey(index, 'humidity')],
    },
  ]);

  if (!rows.length || !hasData) {
    return <EmptyWidgetState label="No climate data for the selected range." />;
  }

  return (
    <div>
      <ChartControls
        csvFilename="hivescale-climate"
        csvRows={rows}
        csvColumns={csvColumns}
        axes={[
          { id: 'temperature', label: 'Temperature', unit: '°C' },
          { id: 'humidity', label: 'Humidity', unit: '%' },
        ]}
        axisScales={axisScales}
        onAxisScalesChange={setAxisScales}
      />
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
              domain={chartDomainForDateRange(dateRange)}
            />
            <YAxis
              yAxisId="temperature"
              unit=" °C"
              width={56}
              domain={axisDomain(axisScales, 'temperature', ['auto', 'auto'])}
            />
            <YAxis
              yAxisId="humidity"
              orientation="right"
              unit=" %"
              width={48}
              domain={axisDomain(axisScales, 'humidity', [0, 100])}
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
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
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
  const csvColumns: CsvColumn[] = [
    { header: 'Battery charge (%)', value: row => row.batterySoc },
    { header: 'Battery voltage (V)', value: row => row.batteryVoltage },
    { header: 'Solar power (mW)', value: row => row.solarPower },
  ];

  if (!rows.length || !hasData) {
    return <EmptyWidgetState label="No power data for the selected range." />;
  }

  return (
    <div>
      <ChartControls
        csvFilename="hivescale-power"
        csvRows={rows}
        csvColumns={csvColumns}
        axes={[
          { id: 'percent', label: 'Charge', unit: '%' },
          { id: 'voltage', label: 'Voltage', unit: 'V' },
          { id: 'power', label: 'Power', unit: 'mW' },
        ]}
        axisScales={axisScales}
        onAxisScalesChange={setAxisScales}
      />
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
              domain={chartDomainForDateRange(dateRange)}
            />
            <YAxis
              yAxisId="percent"
              unit=" %"
              width={48}
              domain={axisDomain(axisScales, 'percent', [0, 'auto'])}
            />
            <YAxis
              yAxisId="voltage"
              orientation="right"
              unit=" V"
              width={48}
              domain={axisDomain(axisScales, 'voltage', ['auto', 'auto'])}
            />
            <YAxis
              yAxisId="power"
              orientation="right"
              unit=" mW"
              width={58}
              domain={axisDomain(axisScales, 'power', ['auto', 'auto'])}
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
              yAxisId="power"
              type="monotone"
              dataKey="solarPower"
              name="Solar power"
              stroke="var(--chart-3)"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
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
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
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
  const csvColumns: CsvColumn[] = [
    { header: 'Bees in', value: row => row.inCount },
    { header: 'Bees out', value: row => row.outCount },
    { header: 'Net flow', value: row => row.net },
  ];

  if (!rows.length || !hasData) {
    return <EmptyWidgetState label="No bee counter data for the selected hives." />;
  }

  return (
    <div>
      <ChartControls
        csvFilename="hivescale-bee-traffic"
        csvRows={rows}
        csvColumns={csvColumns}
        axes={[{ id: 'beecount', label: 'Bee count', unit: 'bees' }]}
        axisScales={axisScales}
        onAxisScalesChange={setAxisScales}
      />
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
              domain={chartDomainForDateRange(dateRange)}
            />
            <YAxis
              yAxisId="beecount"
              width={56}
              domain={axisDomain(axisScales, 'beecount', ['auto', 'auto'])}
            />
            <Tooltip labelFormatter={(value: unknown) => formatDateTime(Number(value))} />
            <Legend />
            <Bar yAxisId="beecount" dataKey="inCount" name="In" fill="var(--chart-3)" />
            <Bar yAxisId="beecount" dataKey="outCount" name="Out" fill="var(--chart-4)" />
            <Line
              yAxisId="beecount"
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
    </div>
  );
}


const soundMetricLabels: Record<SoundMetricKey, { label: string; unit: string; axis: ConfigurableMetricAxis }> = {
  rmsDbfs: { label: 'RMS', unit: 'dBFS', axis: 'dbfs' },
  subBass: { label: 'Sub-bass', unit: 'dBFS', axis: 'dbfs' },
  hum: { label: 'Hum', unit: 'dBFS', axis: 'dbfs' },
  piping: { label: 'Piping', unit: 'dBFS', axis: 'dbfs' },
  stress: { label: 'Stress', unit: 'dBFS', axis: 'dbfs' },
  high: { label: 'High', unit: 'dBFS', axis: 'dbfs' },
  hiveHeartFrequency: { label: 'HiveHeart frequency', unit: 'Hz', axis: 'frequency' },
  hiveHeartEnergy: { label: 'HiveHeart energy', unit: '', axis: 'energy' },
  hiveHeartPeak: { label: 'HiveHeart peak', unit: '', axis: 'energy' },
};

const soundWidgetMetrics: SoundMetricKey[] = [
  'rmsDbfs',
  'subBass',
  'hum',
  'piping',
  'stress',
  'high',
  'hiveHeartFrequency',
  'hiveHeartEnergy',
  'hiveHeartPeak',
];

const vibrationWidgetMetrics: HiveMetricKey[] = [
  'vibration',
  'swarmBand',
  'fanningBand',
  'activityBand',
];

const vibrationMetricLabels: Record<string, string> = {
  vibration: 'RMS',
  swarmBand: 'Swarm band',
  fanningBand: 'Fanning band',
  activityBand: 'Activity band',
};

const hasSeriesData = (rows: ChartRow[], key: string) =>
  rows.some(row => typeof row[key] === 'number');

function SoundRmsWidget({
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
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const visibleHives = useMemo(() => hiveIndexes.slice(0, 4), [hiveIndexes]);
  const rows = useMemo(
    () =>
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

        for (const hiveIndex of visibleHives) {
          const hive = hiveMap.get(hiveIndex) ?? null;
          for (const metric of soundWidgetMetrics) {
            row[soundSeriesKey(hiveIndex, metric)] = soundMetricValue(
              measurement,
              hive,
              hiveIndex,
              metric,
            );
          }
        }
        return row;
      }),
    [dateRange, fallbackNames, measurements, visibleHives],
  );

  const activeMetrics = soundWidgetMetrics.filter(metric =>
    visibleHives.some(index => hasSeriesData(rows, soundSeriesKey(index, metric))),
  );
  const activeAxes = [
    ...new Set(activeMetrics.map(metric => soundMetricLabels[metric].axis)),
  ] as ConfigurableMetricAxis[];
  const csvColumns: CsvColumn[] = visibleHives.flatMap(hiveIndex =>
    activeMetrics
      .filter(metric => hasSeriesData(rows, soundSeriesKey(hiveIndex, metric)))
      .map(metric => ({
        header: `${hiveNames[hiveIndex] ?? `Hive ${hiveIndex}`} ${soundMetricLabels[metric].label}${soundMetricLabels[metric].unit ? ` (${soundMetricLabels[metric].unit})` : ''}`,
        value: row => row[soundSeriesKey(hiveIndex, metric)],
      })),
  );

  if (!rows.length || !activeMetrics.length) {
    return <EmptyWidgetState label="No per-hive acoustic data for the selected hives." />;
  }

  return (
    <div className="space-y-2">
      <ChartControls
        csvFilename="hivescale-acoustic-bands"
        csvRows={rows}
        csvColumns={csvColumns}
        axes={activeAxes.map(axis => ({
          id: axis,
          label: axis,
          unit: configurableMetricAxes[axis].unit,
        }))}
        axisScales={axisScales}
        onAxisScalesChange={setAxisScales}
      />
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
              domain={chartDomainForDateRange(dateRange)}
            />
            {activeAxes.map((axis, index) => {
              const axisConfig = configurableMetricAxes[axis];
              return (
                <YAxis
                  key={axis}
                  yAxisId={axis}
                  orientation={index === 0 ? 'left' : 'right'}
                  unit={axisConfig.unit ? ` ${axisConfig.unit}` : undefined}
                  width={axisConfig.width}
                  domain={axisDomain(axisScales, axis, ['auto', 'auto'])}
                />
              );
            })}
            <Tooltip labelFormatter={(value: unknown) => formatDateTime(Number(value))} />
            <Legend />
            {visibleHives.flatMap((hiveIndex, hivePosition) =>
              activeMetrics
                .filter(metric => hasSeriesData(rows, soundSeriesKey(hiveIndex, metric)))
                .map((metric, metricPosition) => (
                  <Line
                    key={`${hiveIndex}-${metric}`}
                    yAxisId={soundMetricLabels[metric].axis}
                    type="monotone"
                    dataKey={soundSeriesKey(hiveIndex, metric)}
                    name={`${hiveNames[hiveIndex] ?? `Hive ${hiveIndex}`} ${soundMetricLabels[metric].label}`}
                    stroke={chartColors[(hivePosition + metricPosition) % chartColors.length]}
                    strokeDasharray={metric === 'rmsDbfs' ? undefined : '4 2'}
                    dot={false}
                    connectNulls={false}
                    strokeWidth={metric === 'rmsDbfs' ? 1.8 : 1.3}
                    isAnimationActive={false}
                  />
                )),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Shows per-hive acoustic readings first. Legacy left/right microphone data is
        mapped to the configured hive names for slots 1 and 2 when no per-hive
        acoustic block is present.
      </p>
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
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const visibleHives = useMemo(() => hiveIndexes.slice(0, 4), [hiveIndexes]);
  const rows = useMemo(
    () =>
      buildHiveMetricChartRows({
        measurements,
        dateRange,
        fallbackNames,
        hiveIndexes: visibleHives,
        metrics: vibrationWidgetMetrics,
      }),
    [dateRange, fallbackNames, measurements, visibleHives],
  );
  const activeMetrics = vibrationWidgetMetrics.filter(metric =>
    visibleHives.some(index => hasSeriesData(rows, seriesKey(index, metric))),
  );
  const csvColumns: CsvColumn[] = visibleHives.flatMap(hiveIndex =>
    activeMetrics
      .filter(metric => hasSeriesData(rows, seriesKey(hiveIndex, metric)))
      .map(metric => ({
        header: `${hiveNames[hiveIndex] ?? `Hive ${hiveIndex}`} ${vibrationMetricLabels[metric]} (mg)`,
        value: row => row[seriesKey(hiveIndex, metric)],
      })),
  );

  if (!rows.length || !activeMetrics.length) {
    return <EmptyWidgetState label="No vibration or accelerometer band data for the selected hives." />;
  }

  return (
    <div>
      <ChartControls
        csvFilename="hivescale-vibration-bands"
        csvRows={rows}
        csvColumns={csvColumns}
        axes={[{ id: 'vibration', label: 'Vibration', unit: 'mg' }]}
        axisScales={axisScales}
        onAxisScalesChange={setAxisScales}
      />
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
              domain={chartDomainForDateRange(dateRange)}
            />
            <YAxis
              unit=" mg"
              width={58}
              domain={axisDomain(axisScales, 'vibration', [0, 'auto'])}
            />
            <Tooltip labelFormatter={(value: unknown) => formatDateTime(Number(value))} />
            <Legend />
            {visibleHives.flatMap((hiveIndex, hivePosition) =>
              activeMetrics
                .filter(metric => hasSeriesData(rows, seriesKey(hiveIndex, metric)))
                .map((metric, metricPosition) => (
                  <Line
                    key={`${hiveIndex}-${metric}`}
                    type="monotone"
                    dataKey={seriesKey(hiveIndex, metric)}
                    name={`${hiveNames[hiveIndex] ?? `Hive ${hiveIndex}`} ${vibrationMetricLabels[metric]}`}
                    stroke={chartColors[(hivePosition + metricPosition) % chartColors.length]}
                    strokeDasharray={metric === 'vibration' ? undefined : '4 2'}
                    dot={false}
                    connectNulls={false}
                    strokeWidth={metric === 'vibration' ? 1.8 : 1.3}
                    isAnimationActive={false}
                  />
                )),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const temperaturePanelClass = (tempC: number | null): string => {
  if (tempC === null) return 'border-muted bg-muted/20';
  if (tempC < 20) {
    return 'border-sky-300 bg-sky-50/80 dark:border-sky-900 dark:bg-sky-950/30';
  }
  if (tempC < 32) {
    return 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30';
  }
  if (tempC < 36) {
    return 'border-amber-300 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30';
  }
  return 'border-red-300 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30';
};

const temperatureBarClass = (tempC: number | null): string => {
  if (tempC === null) return 'bg-muted-foreground/20';
  if (tempC < 20) return 'bg-sky-500';
  if (tempC < 32) return 'bg-emerald-500';
  if (tempC < 36) return 'bg-amber-500';
  return 'bg-red-500';
};

function TemperatureHeatmapWidget({ slots }: Readonly<{ slots: HiveSlot[] }>) {
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const temps = slots
    .map(slot => slot.tempC)
    .filter((value): value is number => typeof value === 'number');
  const min = temps.length ? Math.min(...temps) : 0;
  const max = temps.length ? Math.max(...temps) : 1;
  const csvRow = slots.reduce<ChartRow>(
    (row, slot) => ({
      ...row,
      [`hive${slot.index}_temperature`]: slot.tempC,
    }),
    { timestamp: Date.now(), measuredAt: new Date().toISOString() },
  );
  const csvColumns: CsvColumn[] = slots.map(slot => ({
    header: `${slot.name} temperature (°C)`,
    value: row => row[`hive${slot.index}_temperature`],
  }));

  return (
    <div className="space-y-3">
      <ChartControls
        csvFilename="hivescale-temperature-heatmap"
        csvRows={[csvRow]}
        csvColumns={csvColumns}
        axes={[]}
        axisScales={axisScales}
        onAxisScalesChange={setAxisScales}
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {slots.map(slot => {
          const normalized =
            slot.tempC === null || max === min
              ? 0
              : Math.max(0, Math.min(1, (slot.tempC - min) / (max - min)));
          return (
            <div
              key={slot.index}
              className={`rounded-md border p-2 ${temperaturePanelClass(slot.tempC)}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium">{slot.name}</span>
                <span className="font-medium">
                  {numberOrDash(slot.tempC)} °C
                </span>
              </div>
              <div className="h-2 rounded-full bg-background/70">
                <div
                  className={`h-2 rounded-full ${temperatureBarClass(slot.tempC)}`}
                  style={{ width: `${slot.tempC === null ? 0 : 20 + normalized * 80}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-sky-300 px-2 py-0.5">cool &lt;20 °C</span>
        <span className="rounded-full border border-emerald-300 px-2 py-0.5">normal 20–32 °C</span>
        <span className="rounded-full border border-amber-300 px-2 py-0.5">warm 32–36 °C</span>
        <span className="rounded-full border border-red-300 px-2 py-0.5">hot ≥36 °C</span>
      </div>
    </div>
  );
}

const formatInsightTitle = (
  alert: HiveScaleInsightAlert,
  hiveNames: Record<number, string>,
): string =>
  alert.title.replace(/\((?:hive|scale)\s*(\d+)\)/gi, (match, channel) => {
    const hiveName = hiveNames[Number(channel)];
    return hiveName ? `(${hiveName})` : match;
  });

function InsightsWidget({
  alerts,
  hiveNames,
  selectedDeviceId,
  scale1Name,
  scale2Name,
  isLoading,
  isError,
}: Readonly<{
  alerts: HiveScaleInsightAlert[];
  hiveNames: Record<number, string>;
  selectedDeviceId: string;
  scale1Name: string;
  scale2Name: string;
  isLoading: boolean;
  isError: boolean;
}>) {
  const historyButton = (
    <HiveScaleInsightsHistoryDialog
      deviceId={selectedDeviceId}
      scale1Name={hiveNames[1] ?? scale1Name}
      scale2Name={hiveNames[2] ?? scale2Name}
    />
  );

  if (isLoading) return <EmptyWidgetState label="Loading insights..." />;
  if (isError) return <EmptyWidgetState label="Insights are unavailable." />;
  if (!alerts.length) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">{historyButton}</div>
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          No active alerts for the selected hives.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          Showing {alerts.length} active alert{alerts.length === 1 ? '' : 's'} for
          the selected hives.
        </span>
        {historyButton}
      </div>
      <div className={`space-y-3 ${alerts.length > 4 ? 'max-h-[28rem] overflow-y-auto pr-1' : ''}`}>
        {alerts.map(alert => {
          const cfg = severityConfig[alert.severity] ?? severityConfig.info;
          return (
            <div key={alert.id} className={`rounded-md border p-3 ${cfg.rowClass}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{formatInsightTitle(alert, hiveNames)}</p>
                  <p className="text-xs text-muted-foreground">
                    {hiveNames[alert.channel] ?? `Hive ${alert.channel}`} ·{' '}
                    {alert.category} · confidence {Math.round(alert.confidence * 100)}%
                  </p>
                </div>
                <Badge variant="outline" className={`shrink-0 ${cfg.badgeClass}`}>
                  {alert.severity}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {alert.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfigurableDiagramWidget({
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
  const visibleHives = useMemo(() => hiveIndexes.slice(0, 6), [hiveIndexes]);
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<string[]>([
    ...defaultConfigurableMetricKeys,
  ]);
  const selectedMetrics = useMemo(
    () => configurableMetrics.filter(metric => selectedMetricKeys.includes(metric.key)),
    [selectedMetricKeys],
  );
  const rows = useMemo(
    () =>
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

        for (const metric of selectedMetrics) {
          if (metric.source === 'device') {
            row[configDeviceSeriesKey(metric.key)] = deviceMetricValue(
              measurement,
              metric.deviceMetric,
            );
            continue;
          }

          for (const hiveIndex of visibleHives) {
            const hive = hiveMap.get(hiveIndex) ?? null;
            row[configSeriesKey(hiveIndex, metric.key)] =
              metric.source === 'hive'
                ? hiveMetricValue(hive, metric.hiveMetric)
                : soundMetricValue(measurement, hive, hiveIndex, metric.soundMetric);
          }
        }
        return row;
      }),
    [dateRange, fallbackNames, measurements, selectedMetrics, visibleHives],
  );

  const toggleMetric = (key: string) => {
    setSelectedMetricKeys(current =>
      current.includes(key)
        ? current.filter(item => item !== key)
        : [...current, key],
    );
  };

  const activeMetrics = selectedMetrics.filter(metric => {
    if (metric.source === 'device') return hasSeriesData(rows, configDeviceSeriesKey(metric.key));
    return visibleHives.some(index => hasSeriesData(rows, configSeriesKey(index, metric.key)));
  });
  const activeAxes = [
    ...new Set(activeMetrics.map(metric => metric.axis)),
  ] as ConfigurableMetricAxis[];
  const csvColumns: CsvColumn[] = activeMetrics.flatMap(metric => {
    if (metric.source === 'device') {
      return [
        {
          header: `${metric.label}${metric.unit ? ` (${metric.unit})` : ''}`,
          value: (row: ChartRow) => row[configDeviceSeriesKey(metric.key)],
        },
      ];
    }

    return visibleHives
      .filter(index => hasSeriesData(rows, configSeriesKey(index, metric.key)))
      .map(index => ({
        header: `${hiveNames[index] ?? `Hive ${index}`} ${metric.label}${metric.unit ? ` (${metric.unit})` : ''}`,
        value: (row: ChartRow) => row[configSeriesKey(index, metric.key)],
      }));
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border p-3">
        {Object.entries(configurableMetricsByGroup).map(([group, metrics]) => (
          <div key={group} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{group}</p>
            <div className="flex flex-wrap gap-1">
              {metrics.map(metric => {
                const selected = selectedMetricKeys.includes(metric.key);
                return (
                  <Badge
                    key={metric.key}
                    variant={selected ? 'default' : 'outline'}
                    className="cursor-pointer select-none"
                    onClick={() => toggleMetric(metric.key)}
                  >
                    {metric.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!rows.length || !activeMetrics.length ? (
        <EmptyWidgetState label="Select at least one metric with data for the selected hives and range." />
      ) : (
        <>
          <ChartControls
            csvFilename="hivescale-configurable-diagram"
            csvRows={rows}
            csvColumns={csvColumns}
            axes={activeAxes.map(axis => ({
              id: axis,
              label: axis,
              unit: configurableMetricAxes[axis].unit,
            }))}
            axisScales={axisScales}
            onAxisScalesChange={setAxisScales}
          />
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  minTickGap={32}
                  scale="time"
                  tickFormatter={formatChartTick}
                  type="number"
                  domain={chartDomainForDateRange(dateRange)}
                />
                {activeAxes.map((axis, index) => {
                  const axisConfig = configurableMetricAxes[axis];
                  return (
                    <YAxis
                      key={axis}
                      yAxisId={axis}
                      orientation={index === 0 ? 'left' : 'right'}
                      unit={axisConfig.unit ? ` ${axisConfig.unit}` : undefined}
                      width={axisConfig.width}
                      domain={axisDomain(
                        axisScales,
                        axis,
                        axis === 'percent' ? [0, 100] : ['auto', 'auto'],
                      )}
                    />
                  );
                })}
                <Tooltip labelFormatter={(value: unknown) => formatDateTime(Number(value))} />
                <Legend />
                {activeMetrics.flatMap((metric, metricPosition) => {
                  if (metric.source === 'device') {
                    return [
                      <Line
                        key={metric.key}
                        yAxisId={metric.axis}
                        type="monotone"
                        dataKey={configDeviceSeriesKey(metric.key)}
                        name={metric.label}
                        stroke={chartColors[metricPosition % chartColors.length]}
                        strokeWidth={1.7}
                        dot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                      />,
                    ];
                  }

                  return visibleHives
                    .filter(index => hasSeriesData(rows, configSeriesKey(index, metric.key)))
                    .map((hiveIndex, hivePosition) => (
                      <Line
                        key={`${hiveIndex}-${metric.key}`}
                        yAxisId={metric.axis}
                        type="monotone"
                        dataKey={configSeriesKey(hiveIndex, metric.key)}
                        name={`${hiveNames[hiveIndex] ?? `Hive ${hiveIndex}`} ${metric.label}`}
                        stroke={chartColors[(hivePosition + metricPosition) % chartColors.length]}
                        strokeDasharray={metricPosition === 0 ? undefined : '4 2'}
                        strokeWidth={metricPosition === 0 ? 1.7 : 1.3}
                        dot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    ));
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
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
  selectedDeviceId,
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
  selectedDeviceId: string;
  insightsLoading: boolean;
  insightsError: boolean;
}) {
  const activeHiveIndexes = selectedHiveIndexes.slice(0, 8);
  const activeAlertHiveIndexes = new Set(activeHiveIndexes);

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
      return (
        <SoundRmsWidget
          measurements={measurements}
          dateRange={dateRange}
          fallbackNames={fallbackNames}
          hiveIndexes={activeHiveIndexes}
          hiveNames={hiveNames}
        />
      );
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
    case 'configurableDiagram':
      return (
        <ConfigurableDiagramWidget
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
          alerts={alerts.filter(alert => activeAlertHiveIndexes.has(alert.channel))}
          hiveNames={hiveNames}
          selectedDeviceId={selectedDeviceId}
          scale1Name={fallbackNames.scale1Name}
          scale2Name={fallbackNames.scale2Name}
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
  hiveMappings,
  alerts,
  insightsLoading,
  insightsError,
}: Readonly<{
  selectedDevice: HiveScaleDevice;
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  onDateRangeChange: (range: HiveScaleDateRange) => void;
  scale1Name: string;
  scale2Name: string;
  hiveMappings: MappedHiveNames;
  alerts: HiveScaleInsightAlert[];
  insightsLoading: boolean;
  insightsError: boolean;
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
  const mappedSlots = useMemo(
    () =>
      slots
        .map(slot => {
          const mappedName = hiveMappings[slot.index]?.trim();
          return mappedName ? { ...slot, name: mappedName } : null;
        })
        .filter((slot): slot is HiveSlot => slot !== null),
    [hiveMappings, slots],
  );
  const hiveNames = useMemo(
    () =>
      Object.fromEntries(mappedSlots.map(slot => [slot.index, slot.name])) as Record<
        number,
        string
      >,
    [mappedSlots],
  );
  const availableHiveIndexes = useMemo(() => {
    const withData = mappedSlots
      .filter(slot => slot.hasData)
      .map(slot => slot.index);
    return withData.length ? withData : mappedSlots.map(slot => slot.index);
  }, [mappedSlots]);
  const mappedHiveIndexes = useMemo(
    () => mappedSlots.map(slot => slot.index),
    [mappedSlots],
  );
  const hiveInsideFirmware = useMemo(
    () => latestHiveInsideFirmwareSummary(measurements, fallbackNames),
    [fallbackNames, measurements],
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
    setSelectedHiveIndexes(current => {
      const valid = current.filter(index => mappedHiveIndexes.includes(index));
      return valid.length ? valid : availableHiveIndexes.slice(0, 4);
    });
  }, [availableHiveIndexes, mappedHiveIndexes]);

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
      <HiveOverviewGrid
        slots={mappedSlots}
        selectedHiveIndexes={selectedHiveIndexes}
        onToggleHive={toggleHive}
        alertsByHive={alertsByHive}
        selectedDevice={selectedDevice}
        latest={latest}
        hiveInsideFirmware={hiveInsideFirmware}
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
                slots: mappedSlots,
                alerts,
                selectedDeviceId: selectedDevice.device_id,
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
