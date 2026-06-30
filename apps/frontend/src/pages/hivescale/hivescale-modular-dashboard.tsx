import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  Activity,
  Battery,
  CheckCircle2,
  ChevronDown,
  Download,
  GripVertical,
  Info,
  Maximize2,
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
import { BeeLoadingMessages } from './hivescale-loading-messages';
import { HiveScaleInsightsHistoryDialog } from './hivescale-insights-history-dialog';

const MAX_HIVE_SLOTS = 18;
const DASHBOARD_STORAGE_VERSION = 2;
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

type DashboardWidgetLayout = {
  w: number;
  h: number;
};

type DashboardWidget = {
  id: string;
  kind: DashboardWidgetKind;
  title: string;
  size: DashboardWidgetSize;
  layout: DashboardWidgetLayout;
};

type StoredDashboardSettings = {
  version: number;
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
type AxisBoundary = keyof AxisScaleSetting;
type AxisScaleEditorState = {
  axisId: string;
  boundary: AxisBoundary;
  value: string;
};
type SvgTextAnchor = 'inherit' | 'start' | 'middle' | 'end';
type RechartsYAxisTickProps = {
  x?: number;
  y?: number;
  fill?: string;
  index?: number;
  visibleTicksCount?: number;
  textAnchor?: SvgTextAnchor;
  payload?: { value?: unknown };
};

const chartColors = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--muted-foreground)',
];

const DASHBOARD_GRID_COLUMNS = 4;
const DASHBOARD_GRID_ROW_HEIGHT_PX = 192;
const DASHBOARD_GRID_GAP_PX = 16;
const DASHBOARD_MIN_WIDGET_WIDTH = 1;
const DASHBOARD_MAX_WIDGET_WIDTH = DASHBOARD_GRID_COLUMNS;
const DASHBOARD_MIN_WIDGET_HEIGHT = 1;
const DASHBOARD_MAX_WIDGET_HEIGHT = 8;

const defaultDashboardLayouts: Record<DashboardWidgetSize, DashboardWidgetLayout> = {
  half: { w: 2, h: 3 },
  wide: { w: 4, h: 3 },
};

const clampInteger = (
  value: unknown,
  min: number,
  max: number,
  fallback: number,
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
};

const normalizeDashboardLayout = (
  layout: Partial<DashboardWidgetLayout> | null | undefined,
  fallback: DashboardWidgetLayout = defaultDashboardLayouts.half,
): DashboardWidgetLayout => ({
  w: clampInteger(
    layout?.w,
    DASHBOARD_MIN_WIDGET_WIDTH,
    DASHBOARD_MAX_WIDGET_WIDTH,
    fallback.w,
  ),
  h: clampInteger(
    layout?.h,
    DASHBOARD_MIN_WIDGET_HEIGHT,
    DASHBOARD_MAX_WIDGET_HEIGHT,
    fallback.h,
  ),
});

const dashboardChartHeightPx = (layout: DashboardWidgetLayout) =>
  Math.max(260, Math.min(760, layout.h * 128 - 48));

const dashboardWidgetGridClass = (layout: DashboardWidgetLayout) => {
  const width = clampInteger(
    layout.w,
    DASHBOARD_MIN_WIDGET_WIDTH,
    DASHBOARD_MAX_WIDGET_WIDTH,
    defaultDashboardLayouts.half.w,
  );
  const height = clampInteger(
    layout.h,
    DASHBOARD_MIN_WIDGET_HEIGHT,
    DASHBOARD_MAX_WIDGET_HEIGHT,
    defaultDashboardLayouts.half.h,
  );
  const mdColSpanByWidth: Record<number, string> = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-2',
    4: 'md:col-span-2',
  };
  const xlColSpanByWidth: Record<number, string> = {
    1: 'xl:col-span-1',
    2: 'xl:col-span-2',
    3: 'xl:col-span-3',
    4: 'xl:col-span-4',
  };
  const rowSpanByHeight: Record<number, string> = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
    4: 'row-span-4',
    5: 'row-span-5',
    6: 'row-span-6',
    7: 'row-span-7',
    8: 'row-span-8',
  };

  return [
    'col-span-1',
    mdColSpanByWidth[width],
    xlColSpanByWidth[width],
    rowSpanByHeight[height],
  ].join(' ');
};

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
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeAxisBoundInput = (value: string): string | null => {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return '';
  return Number.isFinite(Number(trimmed)) ? trimmed : null;
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

const hasCustomAxisBound = (settings: AxisScaleSettingsMap, axisId: string) => {
  const setting = settings[axisId];
  return Boolean(setting?.min.trim() || setting?.max.trim());
};

const updateAxisBoundSetting = (
  onSettingsChange: Dispatch<SetStateAction<AxisScaleSettingsMap>>,
  axisId: string,
  boundary: AxisBoundary,
  value: string,
) => {
  const sanitized = sanitizeAxisBoundInput(value);
  if (sanitized === null) return false;

  onSettingsChange(existing => {
    const nextSetting: AxisScaleSetting = {
      min: existing[axisId]?.min ?? '',
      max: existing[axisId]?.max ?? '',
      [boundary]: sanitized,
    };

    if (!nextSetting.min && !nextSetting.max) {
      const next = { ...existing };
      delete next[axisId];
      return next;
    }

    return { ...existing, [axisId]: nextSetting };
  });

  return true;
};

function AxisBoundEditorInput({
  editor,
  onChange,
  onCommit,
  onCancel,
}: Readonly<{
  editor: AxisScaleEditorState;
  onChange: (value: string) => void;
  onCommit: () => boolean;
  onCancel: () => void;
}>) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editor.axisId, editor.boundary]);

  return (
    <input
      ref={inputRef}
      aria-label={`Set ${editor.axisId} y_${editor.boundary}`}
      className="h-6 w-[4.75rem] rounded border bg-background px-1 text-xs text-foreground shadow-sm outline-none focus:ring-1 focus:ring-ring"
      inputMode="decimal"
      placeholder="auto"
      value={editor.value}
      onBlur={() => {
        const ok = onCommit();
        if (!ok) inputRef.current?.focus();
      }}
      onChange={event => onChange(event.target.value)}
      onClick={event => event.stopPropagation()}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      }}
      title="Leave empty and press Enter for auto"
    />
  );
}

function ClickableYAxisTick({
  axisId,
  displayUnit,
  orientation = 'left',
  settings,
  editor,
  setEditor,
  onSettingsChange,
  ...props
}: Readonly<
  RechartsYAxisTickProps & {
    axisId: string;
    displayUnit?: string;
    orientation?: 'left' | 'right';
    settings: AxisScaleSettingsMap;
    editor: AxisScaleEditorState | null;
    setEditor: Dispatch<SetStateAction<AxisScaleEditorState | null>>;
    onSettingsChange: Dispatch<SetStateAction<AxisScaleSettingsMap>>;
  }
>) {
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const tickIndex = props.index ?? -1;
  const tickCount = props.visibleTicksCount ?? 0;
  const boundary: AxisBoundary | null =
    tickIndex >= 0 && tickCount > 0
      ? tickIndex === 0
        ? 'min'
        : tickIndex === tickCount - 1
          ? 'max'
          : null
      : null;
  const tickValue = props.payload?.value;
  const rawLabel = tickValue === undefined || tickValue === null ? '' : String(tickValue);
  const label = `${rawLabel}${displayUnit ?? ''}`;
  const isEditing =
    boundary !== null && editor?.axisId === axisId && editor.boundary === boundary;
  const inputWidth = 78;
  const inputX = Math.max(0, x - inputWidth + 2);

  if (isEditing) {
    return (
      <foreignObject x={inputX} y={y - 13} width={inputWidth} height={28}>
        <AxisBoundEditorInput
          editor={editor}
          onChange={value =>
            setEditor(current =>
              current?.axisId === axisId && current.boundary === boundary
                ? { ...current, value }
                : current,
            )
          }
          onCancel={() => setEditor(null)}
          onCommit={() => {
            const ok = updateAxisBoundSetting(
              onSettingsChange,
              axisId,
              boundary,
              editor.value,
            );
            if (ok) setEditor(null);
            return ok;
          }}
        />
      </foreignObject>
    );
  }

  const startEdit = () => {
    if (!boundary) return;
    setEditor({
      axisId,
      boundary,
      value: settings[axisId]?.[boundary] || rawLabel,
    });
  };

  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor={props.textAnchor ?? (orientation === 'right' ? 'start' : 'end')}
      fill={props.fill ?? 'currentColor'}
      className={boundary ? 'cursor-pointer select-none hover:fill-foreground' : undefined}
      onClick={startEdit}
      role={boundary ? 'button' : undefined}
      aria-label={boundary ? `Set ${axisId} y_${boundary}` : undefined}
    >
      {boundary && <title>Click to set y_{boundary}; clear for auto</title>}
      {label}
    </text>
  );
}

function useAxisScaleEditor(
  settings: AxisScaleSettingsMap,
  onSettingsChange: Dispatch<SetStateAction<AxisScaleSettingsMap>>,
) {
  const [editor, setEditor] = useState<AxisScaleEditorState | null>(null);

  const tick = (
    axisId: string,
    orientation: 'left' | 'right' = 'left',
    displayUnit?: string,
  ) =>
    (props: RechartsYAxisTickProps) => (
      <ClickableYAxisTick
        {...props}
        axisId={axisId}
        displayUnit={displayUnit}
        orientation={orientation}
        settings={settings}
        editor={editor}
        setEditor={setEditor}
        onSettingsChange={onSettingsChange}
      />
    );

  return { tick };
}

function AxisScaleControls({
  axes,
  settings,
  onSettingsChange,
}: Readonly<{
  axes: AxisScaleDefinition[];
  settings: AxisScaleSettingsMap;
  onSettingsChange: Dispatch<SetStateAction<AxisScaleSettingsMap>>;
}>) {
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
            <span className="text-muted-foreground">
              y_min {axisBoundLabel(setting?.min)} · y_max {axisBoundLabel(setting?.max)}
            </span>
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
      <span className="text-muted-foreground">
        Click the lowest or highest y-axis label to edit. Clear the value for auto.
      </span>
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
    layout: { w: 4, h: 3 },
    description: 'Compare selected hives over the current date range.',
    Icon: Weight,
  },
  climate: {
    kind: 'climate',
    title: 'Hive climate',
    size: 'half',
    layout: { w: 2, h: 3 },
    description: 'Temperature and humidity for selected hives.',
    Icon: Thermometer,
  },
  power: {
    kind: 'power',
    title: 'Power health',
    size: 'half',
    layout: { w: 2, h: 3 },
    description: 'Battery charge, battery voltage, and solar input.',
    Icon: Battery,
  },
  beeTraffic: {
    kind: 'beeTraffic',
    title: 'Bee traffic',
    size: 'half',
    layout: { w: 2, h: 3 },
    description: 'Aggregate in/out traffic and net flow.',
    Icon: Activity,
  },
  soundRms: {
    kind: 'soundRms',
    title: 'Sound / acoustic bands',
    size: 'half',
    layout: { w: 2, h: 3 },
    description: 'Per-hive acoustic RMS and FFT/HiveHeart bands when available.',
    Icon: Activity,
  },
  vibration: {
    kind: 'vibration',
    title: 'Vibration bands',
    size: 'half',
    layout: { w: 2, h: 3 },
    description: 'RMS vibration, swarm, fanning, and activity bands.',
    Icon: Activity,
  },
  configurableDiagram: {
    kind: 'configurableDiagram',
    title: 'Configurable diagram',
    size: 'wide',
    layout: { w: 4, h: 4 },
    description: 'Choose the hive, sound, traffic, climate, and device metrics to plot.',
    Icon: Activity,
  },
  temperatureHeatmap: {
    kind: 'temperatureHeatmap',
    title: 'Temperature heatmap',
    size: 'wide',
    layout: { w: 4, h: 2 },
    description: 'Compact all-hive temperature overview.',
    Icon: Thermometer,
  },
  insights: {
    kind: 'insights',
    title: 'Insights feed',
    size: 'half',
    layout: { w: 2, h: 2 },
    description: 'Active alerts and evidence snippets.',
    Icon: Info,
  },
  dataQuality: {
    kind: 'dataQuality',
    title: 'Data quality',
    size: 'half',
    layout: { w: 2, h: 2 },
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
].map(({ id, kind, title, size, layout }) => ({
  id,
  kind,
  title,
  size,
  layout: { ...layout },
}));

const createWidgetId = (kind: DashboardWidgetKind) =>
  `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const dashboardStorageKey = (deviceId: string, version = DASHBOARD_STORAGE_VERSION) =>
  `${dashboardStoragePrefix}${deviceId}:v${version}`;

const normalizeDashboardWidget = (value: unknown): DashboardWidget | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<DashboardWidget> & { layout?: Partial<DashboardWidgetLayout> };
  if (
    typeof raw.id !== 'string' ||
    typeof raw.kind !== 'string' ||
    !(raw.kind in widgetTemplates)
  ) {
    return null;
  }

  const kind = raw.kind as DashboardWidgetKind;
  const template = widgetTemplates[kind];
  const size: DashboardWidgetSize =
    raw.size === 'half' || raw.size === 'wide' ? raw.size : template.size;
  const layout = normalizeDashboardLayout(
    raw.layout,
    template.layout ?? defaultDashboardLayouts[size],
  );

  return {
    id: raw.id,
    kind,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : template.title,
    size,
    layout,
  };
};

const cloneDefaultWidgets = () =>
  defaultWidgets.map(widget => ({
    ...widget,
    layout: { ...widget.layout },
  }));

const loadDashboardSettings = (deviceId: string): DashboardWidget[] => {
  if (typeof globalThis.window === 'undefined') return cloneDefaultWidgets();

  for (const key of [dashboardStorageKey(deviceId), dashboardStorageKey(deviceId, 1)]) {
    try {
      const raw = globalThis.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<StoredDashboardSettings>;
      if (!Array.isArray(parsed.widgets) || !parsed.widgets.length) continue;

      const widgets = parsed.widgets
        .map(normalizeDashboardWidget)
        .filter((widget): widget is DashboardWidget => widget !== null);
      if (widgets.length) return widgets;
    } catch {
      // Ignore broken user-specific dashboard state and keep trying fallbacks.
    }
  }

  return cloneDefaultWidgets();
};

const saveDashboardSettings = (deviceId: string, widgets: DashboardWidget[]) => {
  if (typeof globalThis.window === 'undefined') return;

  try {
    const value: StoredDashboardSettings = {
      version: DASHBOARD_STORAGE_VERSION,
      widgets: widgets.map(widget => ({
        ...widget,
        layout: normalizeDashboardLayout(
          widget.layout,
          widgetTemplates[widget.kind].layout,
        ),
      })),
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
                Map HiveHub slots to HivePal hives in the device setup panel to
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
  layout,
  isEditing,
  isDragging,
  onRemove,
  onDragStart,
  onDragEnd,
  onResizeStart,
  children,
}: Readonly<{
  title: string;
  description: string;
  layout: DashboardWidgetLayout;
  isEditing: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onDragStart: (event: ReactDragEvent<HTMLButtonElement>) => void;
  onDragEnd: (event: ReactDragEvent<HTMLButtonElement>) => void;
  onResizeStart: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}>) {
  return (
    <Card
      className={`relative flex h-full flex-col overflow-hidden transition ${
        isEditing ? 'ring-1 ring-dashed ring-muted-foreground/30' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isEditing && (
              <>
                <Badge variant="secondary" className="text-[10px]">
                  {layout.w} x {layout.h}
                </Badge>
                <button
                  type="button"
                  draggable
                  className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground active:cursor-grabbing"
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  aria-label={`Move ${title}`}
                  title="Drag to move this widget"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={onRemove}
                  aria-label={`Remove ${title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={`flex-1 ${isEditing ? 'pb-9' : ''}`}>
        {children}
      </CardContent>
      {isEditing && (
        <button
          type="button"
          className="absolute bottom-2 right-2 inline-flex h-7 w-7 cursor-nwse-resize items-center justify-center rounded-md border bg-background/95 text-muted-foreground shadow-sm hover:text-foreground"
          onPointerDown={onResizeStart}
          aria-label={`Resize ${title}`}
          title="Drag to resize this widget"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
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
  chartHeightPx = 288,
}: Readonly<{
  rows: ChartRow[];
  hiveIndexes: number[];
  metric: HiveMetricKey;
  hiveNames: Record<number, string>;
  unit: string;
  dateRange: HiveScaleDateRange;
  chartHeightPx?: number;
}>) {
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const axisScaleEditor = useAxisScaleEditor(axisScales, setAxisScales);
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
      <div style={{ height: chartHeightPx }}>
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
              allowDataOverflow={hasCustomAxisBound(axisScales, 'main')}
              tick={axisScaleEditor.tick('main', 'left', ` ${unit}`)}
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
  chartHeightPx = 288,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  hiveNames: Record<number, string>;
  chartHeightPx?: number;
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
      chartHeightPx={chartHeightPx}
    />
  );
}

function ClimateWidget({
  measurements,
  dateRange,
  fallbackNames,
  hiveIndexes,
  hiveNames,
  chartHeightPx = 288,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  hiveNames: Record<number, string>;
  chartHeightPx?: number;
}>) {
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const axisScaleEditor = useAxisScaleEditor(axisScales, setAxisScales);
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
      <div style={{ height: chartHeightPx }}>
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
              allowDataOverflow={hasCustomAxisBound(axisScales, 'temperature')}
              tick={axisScaleEditor.tick('temperature', 'left', ' °C')}
            />
            <YAxis
              yAxisId="humidity"
              orientation="right"
              unit=" %"
              width={48}
              domain={axisDomain(axisScales, 'humidity', [0, 100])}
              allowDataOverflow={hasCustomAxisBound(axisScales, 'humidity')}
              tick={axisScaleEditor.tick('humidity', 'right', ' %')}
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
  chartHeightPx = 288,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  chartHeightPx?: number;
}>) {
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const axisScaleEditor = useAxisScaleEditor(axisScales, setAxisScales);
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
      <div style={{ height: chartHeightPx }}>
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
              allowDataOverflow={hasCustomAxisBound(axisScales, 'percent')}
              tick={axisScaleEditor.tick('percent', 'left', ' %')}
            />
            <YAxis
              yAxisId="voltage"
              orientation="right"
              unit=" V"
              width={48}
              domain={axisDomain(axisScales, 'voltage', ['auto', 'auto'])}
              allowDataOverflow={hasCustomAxisBound(axisScales, 'voltage')}
              tick={axisScaleEditor.tick('voltage', 'right', ' V')}
            />
            <YAxis
              yAxisId="power"
              orientation="right"
              unit=" mW"
              width={58}
              domain={axisDomain(axisScales, 'power', ['auto', 'auto'])}
              allowDataOverflow={hasCustomAxisBound(axisScales, 'power')}
              tick={axisScaleEditor.tick('power', 'right', ' mW')}
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
  chartHeightPx = 288,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  chartHeightPx?: number;
}>) {
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const axisScaleEditor = useAxisScaleEditor(axisScales, setAxisScales);
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
      <div style={{ height: chartHeightPx }}>
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
              allowDataOverflow={hasCustomAxisBound(axisScales, 'beecount')}
              tick={axisScaleEditor.tick('beecount')}
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
  chartHeightPx = 288,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  hiveNames: Record<number, string>;
  chartHeightPx?: number;
}>) {
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const axisScaleEditor = useAxisScaleEditor(axisScales, setAxisScales);
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
      <div style={{ height: chartHeightPx }}>
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
                  allowDataOverflow={hasCustomAxisBound(axisScales, axis)}
                  tick={axisScaleEditor.tick(
                    axis,
                    index === 0 ? 'left' : 'right',
                    axisConfig.unit ? ` ${axisConfig.unit}` : undefined,
                  )}
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
  chartHeightPx = 288,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  hiveNames: Record<number, string>;
  chartHeightPx?: number;
}>) {
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const axisScaleEditor = useAxisScaleEditor(axisScales, setAxisScales);
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
      <div style={{ height: chartHeightPx }}>
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
              allowDataOverflow={hasCustomAxisBound(axisScales, 'vibration')}
              tick={axisScaleEditor.tick('vibration', 'left', ' mg')}
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
  if (tempC < 33) {
    return 'border-sky-300 bg-sky-50/80 dark:border-sky-900 dark:bg-sky-950/30';
  }
  if (tempC <= 36) {
    return 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30';
  }
  return 'border-red-300 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30';
};

const temperatureBarClass = (tempC: number | null): string => {
  if (tempC === null) return 'bg-muted-foreground/20';
  if (tempC < 33) return 'bg-sky-500';
  if (tempC <= 36) return 'bg-emerald-500';
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
        <span className="rounded-full border border-sky-300 px-2 py-0.5">low &lt;33 °C</span>
        <span className="rounded-full border border-emerald-300 px-2 py-0.5">optimal brood 33–36 °C</span>
        <span className="rounded-full border border-red-300 px-2 py-0.5">high &gt;36 °C</span>
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
  chartHeightPx = 384,
}: Readonly<{
  measurements: HiveScaleMeasurement[] | undefined;
  dateRange: HiveScaleDateRange;
  fallbackNames: HiveFallbackNames;
  hiveIndexes: number[];
  hiveNames: Record<number, string>;
  chartHeightPx?: number;
}>) {
  const visibleHives = useMemo(() => hiveIndexes.slice(0, 6), [hiveIndexes]);
  const [axisScales, setAxisScales] = useState<AxisScaleSettingsMap>({});
  const axisScaleEditor = useAxisScaleEditor(axisScales, setAxisScales);
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
          <div style={{ height: chartHeightPx }}>
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
                      allowDataOverflow={hasCustomAxisBound(axisScales, axis)}
                      tick={axisScaleEditor.tick(
                        axis,
                        index === 0 ? 'left' : 'right',
                        axisConfig.unit ? ` ${axisConfig.unit}` : undefined,
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
                <p className="mt-2 text-xs text-muted-foreground">
                  Default size {template.layout.w} x {template.layout.h}
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
  measurementsLoading,
  insightsLoading,
  insightsError,
  chartHeightPx,
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
  measurementsLoading: boolean;
  insightsLoading: boolean;
  insightsError: boolean;
  chartHeightPx: number;
}) {
  const activeHiveIndexes = selectedHiveIndexes.slice(0, 8);
  const activeAlertHiveIndexes = new Set(activeHiveIndexes);
  const isDiagramWidget = widget.kind !== 'insights' && widget.kind !== 'dataQuality';

  if (measurementsLoading && isDiagramWidget) {
    return (
      <div style={{ minHeight: chartHeightPx }}>
        <BeeLoadingMessages
          intervalMs={1000}
          className="h-full min-h-72 rounded-md border border-dashed"
        />
      </div>
    );
  }

  switch (widget.kind) {
    case 'weightComparison':
      return (
        <WeightComparisonWidget
          measurements={measurements}
          dateRange={dateRange}
          fallbackNames={fallbackNames}
          hiveIndexes={activeHiveIndexes}
          hiveNames={hiveNames}
          chartHeightPx={chartHeightPx}
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
          chartHeightPx={chartHeightPx}
        />
      );
    case 'power':
      return (
        <PowerWidget
          measurements={measurements}
          dateRange={dateRange}
          chartHeightPx={chartHeightPx}
        />
      );
    case 'beeTraffic':
      return (
        <BeeTrafficWidget
          measurements={measurements}
          dateRange={dateRange}
          fallbackNames={fallbackNames}
          hiveIndexes={activeHiveIndexes}
          chartHeightPx={chartHeightPx}
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
          chartHeightPx={chartHeightPx}
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
          chartHeightPx={chartHeightPx}
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
          chartHeightPx={chartHeightPx}
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
  measurementsLoading,
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
  measurementsLoading: boolean;
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
  const dashboardGridRef = useRef<HTMLDivElement | null>(null);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [dashboardEditing, setDashboardEditing] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dropTargetWidgetId, setDropTargetWidgetId] = useState<string | null>(null);

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
        layout: { ...template.layout },
      },
    ]);
    setShowAddWidget(false);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(current => current.filter(widget => widget.id !== widgetId));
  };

  const resetDashboard = () => {
    setWidgets(cloneDefaultWidgets());
  };

  const updateWidgetLayout = (
    widgetId: string,
    layout: Partial<DashboardWidgetLayout>,
  ) => {
    setWidgets(current =>
      current.map(widget =>
        widget.id === widgetId
          ? {
              ...widget,
              layout: normalizeDashboardLayout(
                { ...widget.layout, ...layout },
                widgetTemplates[widget.kind].layout,
              ),
            }
          : widget,
      ),
    );
  };

  const moveWidget = (draggedId: string, targetId: string | null) => {
    if (targetId === draggedId) return;

    setWidgets(current => {
      const dragged = current.find(widget => widget.id === draggedId);
      if (!dragged) return current;

      const remaining = current.filter(widget => widget.id !== draggedId);
      const targetIndex = targetId
        ? remaining.findIndex(widget => widget.id === targetId)
        : remaining.length;
      const insertIndex = targetIndex >= 0 ? targetIndex : remaining.length;

      return [
        ...remaining.slice(0, insertIndex),
        dragged,
        ...remaining.slice(insertIndex),
      ];
    });
  };

  const startWidgetDrag = (
    widgetId: string,
    event: ReactDragEvent<HTMLButtonElement>,
  ) => {
    if (!dashboardEditing) return;
    setDraggedWidgetId(widgetId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', widgetId);
  };

  const finishWidgetDrag = () => {
    setDraggedWidgetId(null);
    setDropTargetWidgetId(null);
  };

  const handleWidgetDragOver = (
    widgetId: string,
    event: ReactDragEvent<HTMLDivElement>,
  ) => {
    if (!dashboardEditing || !draggedWidgetId || draggedWidgetId === widgetId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetWidgetId(widgetId);
  };

  const handleWidgetDrop = (
    widgetId: string,
    event: ReactDragEvent<HTMLDivElement>,
  ) => {
    if (!dashboardEditing) return;
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain') || draggedWidgetId;
    if (draggedId) moveWidget(draggedId, widgetId);
    finishWidgetDrag();
  };

  const handleEndDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!dashboardEditing) return;
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain') || draggedWidgetId;
    if (draggedId) moveWidget(draggedId, null);
    finishWidgetDrag();
  };

  const beginWidgetResize = (
    widget: DashboardWidget,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!dashboardEditing || typeof document === 'undefined') return;
    event.preventDefault();
    event.stopPropagation();

    const startLayout = normalizeDashboardLayout(
      widget.layout,
      widgetTemplates[widget.kind].layout,
    );
    const gridElement = dashboardGridRef.current;
    const gridRect = gridElement?.getBoundingClientRect();
    let columnWidth = 240;
    let gapPx = DASHBOARD_GRID_GAP_PX;

    if (gridElement && gridRect && typeof globalThis.window !== 'undefined') {
      const styles = globalThis.window.getComputedStyle(gridElement);
      gapPx = Number.parseFloat(styles.columnGap) || DASHBOARD_GRID_GAP_PX;
      const columnCount = Math.max(
        1,
        styles.gridTemplateColumns.split(' ').filter(Boolean).length,
      );
      columnWidth = Math.max(
        80,
        (gridRect.width - gapPx * (columnCount - 1)) / columnCount,
      );
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const applyResize = (clientX: number, clientY: number) => {
      const widthDelta = Math.round((clientX - startX) / (columnWidth + gapPx));
      const heightDelta = Math.round(
        (clientY - startY) / (DASHBOARD_GRID_ROW_HEIGHT_PX + gapPx),
      );
      updateWidgetLayout(widget.id, {
        w: startLayout.w + widthDelta,
        h: startLayout.h + heightDelta,
      });
    };
    const onPointerMove = (moveEvent: PointerEvent) => {
      applyResize(moveEvent.clientX, moveEvent.clientY);
    };
    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp, { once: true });
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
            {dashboardEditing
              ? 'Edit mode: drag the handle to move widgets and drag the corner to resize them on a 4-column grid.'
              : 'User-configurable widgets. The selected hives above control hive-based charts.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeControls
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
          <Button
            type="button"
            variant={dashboardEditing ? 'default' : 'outline'}
            onClick={() => setDashboardEditing(editing => !editing)}
          >
            {dashboardEditing ? 'Done' : 'Edit dashboard'}
          </Button>
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

      {dashboardEditing && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
          Dashboard edit mode is active. Use the grip handle in each widget header
          to move it, and drag the lower-right corner to resize width or height.
          Layout changes are saved automatically for this HiveHub device.
        </div>
      )}

      {widgets.length ? (
        <div
          ref={dashboardGridRef}
          className="grid auto-rows-[minmax(12rem,auto)] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {widgets.map(widget => {
            const layout = normalizeDashboardLayout(
              widget.layout,
              widgetTemplates[widget.kind].layout,
            );
            const isDragging = draggedWidgetId === widget.id;
            const isDropTarget =
              dropTargetWidgetId === widget.id && draggedWidgetId !== widget.id;

            return (
              <div
                key={widget.id}
                className={`${dashboardWidgetGridClass(layout)} ${
                  isDropTarget
                    ? 'rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : ''
                }`}
                onDragOver={event => handleWidgetDragOver(widget.id, event)}
                onDrop={event => handleWidgetDrop(widget.id, event)}
              >
                <WidgetShell
                  title={widget.title}
                  description={widgetTemplates[widget.kind].description}
                  layout={layout}
                  isEditing={dashboardEditing}
                  isDragging={isDragging}
                  onRemove={() => removeWidget(widget.id)}
                  onDragStart={event => startWidgetDrag(widget.id, event)}
                  onDragEnd={finishWidgetDrag}
                  onResizeStart={event => beginWidgetResize(widget, event)}
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
                    measurementsLoading,
                    insightsLoading,
                    insightsError,
                    chartHeightPx: dashboardChartHeightPx(layout),
                  })}
                </WidgetShell>
              </div>
            );
          })}
          {dashboardEditing && widgets.length > 1 && (
            <div
              className={`col-span-1 flex min-h-24 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-4 ${
                dropTargetWidgetId === '__dashboard-end'
                  ? 'border-primary bg-primary/5 text-foreground'
                  : ''
              }`}
              onDragOver={event => {
                if (!draggedWidgetId) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTargetWidgetId('__dashboard-end');
              }}
              onDrop={handleEndDrop}
            >
              Drop here to move a widget to the end of the dashboard.
            </div>
          )}
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
