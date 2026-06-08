import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  Activity,
  Battery,
  ClipboardCheck,
  Download,
  Droplets,
  Frame,
  Scale,
  PackagePlus,
  Pill,
  Sun,
  Thermometer,
  Utensils,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ActionType,
  type HiveWithBoxesResponse,
  type InspectionResponse,
} from 'shared-schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BeeLoadingMessages } from './hivescale-loading-messages';
import type {
  HiveScaleDevice,
  HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';

export type HiveScaleDateRangePreset =
  | '24h'
  | '7d'
  | '30d'
  | '365d'
  | 'currentYear'
  | 'all'
  | 'custom';

export interface HiveScaleDateRange {
  preset: HiveScaleDateRangePreset;
  startAt?: string;
  endAt?: string;
}

type SeriesAxis =
  | 'weight'
  | 'temperature'
  | 'humidity'
  | 'voltage'
  | 'percent'
  | 'current'
  | 'power'
  | 'dbfs'
  | 'beecount';

type SeriesKey =
  | 'scale1Weight'
  | 'scale1Temperature'
  | 'scale2Weight'
  | 'scale2Temperature'
  | 'ambientTemperature'
  | 'ambientHumidity'
  | 'batteryVoltage'
  | 'batterySoc'
  | 'solarLoadVoltage'
  | 'solarCurrent'
  | 'solarPower'
  | 'micLeftRms'
  | 'micRightRms'
  | 'beeCounter1In'
  | 'beeCounter1Out'
  | 'beeCounter1Net'
  | 'beeCounter2In'
  | 'beeCounter2Out'
  | 'beeCounter2Net';

interface DiagramSeries {
  key: SeriesKey;
  label: string;
  dataKey: string;
  axis: SeriesAxis;
  unit: string;
  stroke: string;
  group: string;
  // Layout: which of the three toggle columns this series belongs to, and the
  // sub-heading it sits under within that column.
  column: 1 | 2 | 3;
  subgroup: string;
}

interface ChartMarker {
  id: string;
  timestamp: number;
  date: string;
  type:
    | 'inspection'
    | 'maintenance'
    | 'feeding'
    | 'frames'
    | 'treatment'
    | 'box';
  label: string;
  detail: string;
  hiveName: string;
  Icon: LucideIcon;
}

type AxisScaleMode = 'maxRange' | 'zeroToMax' | 'custom';
type AxisDomain = [number, number];

type VisibleSeriesMap = Record<SeriesKey, boolean>;

interface AxisScaleSettings {
  scaleMode: AxisScaleMode;
  customMin: string;
  customMax: string;
  side: 'left' | 'right';
}

type AxisScaleSettingsMap = Record<SeriesAxis, AxisScaleSettings>;

interface StoredDiagramSettings {
  version: 5;
  visibleSeries: VisibleSeriesMap;
  axes: AxisScaleSettingsMap;
}

const diagramSettingsStoragePrefix = 'hivepal:hivescale-diagram:';

const defaultVisibleSeries: VisibleSeriesMap = {
  scale1Weight: true,
  scale1Temperature: true,
  scale2Weight: true,
  scale2Temperature: true,
  ambientTemperature: false,
  ambientHumidity: false,
  batteryVoltage: false,
  batterySoc: false,
  solarLoadVoltage: false,
  solarCurrent: false,
  solarPower: false,
  micLeftRms: false,
  micRightRms: false,
  beeCounter1In: false,
  beeCounter1Out: false,
  beeCounter1Net: false,
  beeCounter2In: false,
  beeCounter2Out: false,
  beeCounter2Net: false,
};

const defaultAxisSettings: AxisScaleSettings = {
  scaleMode: 'maxRange',
  customMin: '',
  customMax: '',
  side: 'left',
};

const getDefaultDiagramSettings = (): StoredDiagramSettings => ({
  version: 5,
  visibleSeries: { ...defaultVisibleSeries },
  axes: {
    weight: { ...defaultAxisSettings, side: 'left' },
    temperature: { ...defaultAxisSettings, side: 'right' },
    humidity: { ...defaultAxisSettings, side: 'right' },
    voltage: { ...defaultAxisSettings, side: 'right' },
    percent: { ...defaultAxisSettings, side: 'right' },
    current: { ...defaultAxisSettings, side: 'right' },
    power: { ...defaultAxisSettings, side: 'right' },
    dbfs: { ...defaultAxisSettings, side: 'right' },
    beecount: { ...defaultAxisSettings, scaleMode: 'zeroToMax', side: 'right' },
  },
});

const presetButtonLabel = (preset: HiveScaleDateRangePreset): string => {
  if (preset === 'currentYear') return new Date().getFullYear().toString();
  if (preset === 'all') return 'All';
  return preset;
};

const axisOrder: SeriesAxis[] = [
  'weight',
  'temperature',
  'humidity',
  'voltage',
  'percent',
  'current',
  'power',
  'dbfs',
  'beecount',
];

const axisPresentation: Record<
  SeriesAxis,
  { label: string; unit: string; Icon: LucideIcon }
> = {
  weight: { label: 'Weight', unit: 'kg', Icon: Scale },
  temperature: { label: 'Temperature', unit: '°C', Icon: Thermometer },
  humidity: { label: 'Humidity', unit: '%', Icon: Droplets },
  voltage: { label: 'Voltage', unit: 'V', Icon: Battery },
  percent: { label: 'Percent', unit: '%', Icon: Battery },
  current: { label: 'Current', unit: 'mA', Icon: Zap },
  power: { label: 'Power', unit: 'mW', Icon: Sun },
  dbfs: { label: 'Sound', unit: 'dBFS', Icon: Activity },
  beecount: { label: 'Bee count', unit: 'bees', Icon: Activity },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatChartTick = (value: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatRelativeTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return '—';
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
  return '—';
};

const escapeCsvField = (str: string): string => {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toFiniteNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const cleanTemperature = (value: unknown): number | null => {
  const n = toFiniteNumber(value);
  if (n === null) return null;
  // Filter out sentinel values (e.g. 85°C from disconnected DS18B20 sensors)
  if (n >= 84.5 && n <= 85.5) return null;
  return n;
};

const getAxisDomain = (
  settings: AxisScaleSettings,
  values: unknown[],
): AxisDomain | undefined => {
  const finite = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  if (!finite.length) return undefined;

  const min = Math.min(...finite);
  const max = Math.max(...finite);

  switch (settings.scaleMode) {
    case 'zeroToMax':
      return [0, max];
    case 'custom': {
      const customMin = Number.parseFloat(settings.customMin);
      const customMax = Number.parseFloat(settings.customMax);
      if (Number.isFinite(customMin) && Number.isFinite(customMax)) {
        return [customMin, customMax];
      }
      if (Number.isFinite(customMin)) return [customMin, max];
      if (Number.isFinite(customMax)) return [min, customMax];
      return undefined;
    }
    default:
      return undefined;
  }
};

const shouldAllowAxisDataOverflow = (settings: AxisScaleSettings) =>
  settings.scaleMode === 'custom';

// The upstream measurement API returns raw samples (no server-side
// downsampling) and simply caps the result to the most recent `limit` rows.
// Devices report roughly every 5 minutes, so the limit has to cover the entire
// requested window at that cadence — otherwise long ranges silently truncate to
// only the newest samples (e.g. a 7d window would show ~2 days). We size the
// limit from the window length and apply a guardrail cap so very long ranges
// don't overwhelm the chart/payload.
const MEASUREMENT_SAMPLES_PER_DAY = (24 * 60) / 5; // ~5-min cadence => 288/day
const MAX_MEASUREMENT_POINTS = 20000;

const measurementLimitForDays = (days: number): number =>
  Math.min(
    MAX_MEASUREMENT_POINTS,
    Math.max(1, Math.ceil(days * MEASUREMENT_SAMPLES_PER_DAY)),
  );

export const measurementLimitForRange = (range: HiveScaleDateRange): number => {
  switch (range.preset) {
    case '24h':
      return measurementLimitForDays(1);
    case '7d':
      return measurementLimitForDays(7);
    case '30d':
      return measurementLimitForDays(30);
    case '365d':
    case 'currentYear':
      return MAX_MEASUREMENT_POINTS;
    case 'custom': {
      if (range.startAt) {
        const startMs = new Date(range.startAt).getTime();
        const endMs = range.endAt
          ? new Date(range.endAt).getTime()
          : Date.now();
        const days = (endMs - startMs) / (24 * 60 * 60 * 1000);
        if (Number.isFinite(days) && days > 0) {
          return measurementLimitForDays(days);
        }
      }
      return MAX_MEASUREMENT_POINTS;
    }
    case 'all':
    default:
      return MAX_MEASUREMENT_POINTS;
  }
};

export const createPresetDateRange = (
  preset: HiveScaleDateRangePreset,
): HiveScaleDateRange => {
  const now = new Date();
  switch (preset) {
    case '24h':
      return {
        preset,
        startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      };
    case '7d':
      return {
        preset,
        startAt: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    case '30d':
      return {
        preset,
        startAt: new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    case '365d':
      return {
        preset,
        startAt: new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    case 'currentYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { preset, startAt: start.toISOString() };
    }
    case 'all':
      return { preset };
    case 'custom':
      return { preset };
    default:
      return {
        preset: '7d',
        startAt: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
  }
};

const mergeVisibleSeries = (value: unknown): VisibleSeriesMap => ({
  ...defaultVisibleSeries,
  ...(value && typeof value === 'object'
    ? Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(
          ([k]) => k in defaultVisibleSeries,
        ),
      )
    : {}),
});

const mergeAxisSettings = (value: unknown): AxisScaleSettingsMap => {
  const defaults = getDefaultDiagramSettings().axes;
  if (!value || typeof value !== 'object') return defaults;
  const patch = value as Record<string, unknown>;
  return Object.fromEntries(
    axisOrder.map(axis => [
      axis,
      {
        ...defaults[axis],
        ...(patch[axis] && typeof patch[axis] === 'object' ? patch[axis] : {}),
      },
    ]),
  ) as AxisScaleSettingsMap;
};

const loadDiagramSettings = (deviceId: string): StoredDiagramSettings => {
  try {
    const raw = localStorage.getItem(
      `${diagramSettingsStoragePrefix}${deviceId}`,
    );
    if (!raw) return getDefaultDiagramSettings();
    const parsed = JSON.parse(raw) as Partial<StoredDiagramSettings>;
    // version 5 adds beecount series — reset if older
    if (parsed.version !== 5) return getDefaultDiagramSettings();
    return {
      version: 5,
      visibleSeries: mergeVisibleSeries(parsed.visibleSeries),
      axes: mergeAxisSettings(parsed.axes),
    };
  } catch {
    return getDefaultDiagramSettings();
  }
};

const saveDiagramSettings = (
  deviceId: string,
  settings: StoredDiagramSettings,
) => {
  try {
    localStorage.setItem(
      `${diagramSettingsStoragePrefix}${deviceId}`,
      JSON.stringify(settings),
    );
  } catch {
    // localStorage unavailable; silently ignore
  }
};

// ---------------------------------------------------------------------------
// Inspection / box markers
// ---------------------------------------------------------------------------

const ACTION_MARKER_MAP: Partial<Record<ActionType, ChartMarker['type']>> = {
  [ActionType.MAINTENANCE]: 'maintenance',
  [ActionType.FEEDING]: 'feeding',
  [ActionType.FRAME]: 'frames',
  [ActionType.TREATMENT]: 'treatment',
};

const ACTION_ICON_MAP: Partial<Record<ActionType, LucideIcon>> = {
  [ActionType.MAINTENANCE]: Wrench,
  [ActionType.FEEDING]: Utensils,
  [ActionType.FRAME]: Frame,
  [ActionType.TREATMENT]: Pill,
};

const normalizeName = (name: string | null | undefined) =>
  (name ?? '').trim().toLowerCase();

const buildInspectionMarkers = (
  inspections: InspectionResponse[] | undefined,
  hives: HiveWithBoxesResponse[],
  mappedHiveIds: string[],
): ChartMarker[] => {
  if (!inspections) return [];
  return inspections
    .filter(ins => mappedHiveIds.includes(ins.hiveId))
    .flatMap(ins => {
      const hive = hives.find(h => h.id === ins.hiveId);
      const hiveName = hive?.name ?? ins.hiveId;
      const base: ChartMarker = {
        id: `ins-${ins.id}`,
        timestamp: new Date(ins.date).getTime(),
        date: ins.date,
        type: 'inspection',
        label: 'Inspection',
        detail: '',
        hiveName,
        Icon: ClipboardCheck,
      };
      const actionMarkers: ChartMarker[] = (ins.actions ?? [])
        .filter(a => ACTION_MARKER_MAP[a.type])
        .map(a => {
          const actionType = a.type as string;
          return {
            id: `act-${ins.id}-${actionType}`,
            timestamp: new Date(ins.date).getTime(),
            date: ins.date,
            type: ACTION_MARKER_MAP[a.type]!,
            label:
              actionType.charAt(0) +
              actionType.slice(1).toLowerCase().replace(/_/g, ' '),
            detail: '',
            hiveName,
            Icon: ACTION_ICON_MAP[a.type] ?? Wrench,
          };
        });
      return [base, ...actionMarkers];
    });
};

const buildBoxAddedMarkers = (
  hives: HiveWithBoxesResponse[],
  mappedHiveIds: string[],
  startAt?: string,
  endAt?: string,
): ChartMarker[] => {
  const startMs = startAt ? new Date(startAt).getTime() : 0;
  const endMs = endAt ? new Date(endAt).getTime() : Infinity;
  return hives
    .filter(h => mappedHiveIds.includes(h.id))
    .flatMap(h =>
      (h.boxes ?? [])
        .filter(box => {
          if (!box.addedAt) return false;
          const ts = new Date(box.addedAt).getTime();
          return ts >= startMs && ts <= endMs;
        })
        .map(box => ({
          id: `box-${h.id}-${box.id}`,
          timestamp: new Date(box.addedAt ?? 0).getTime(),
          date: box.addedAt ? new Date(box.addedAt).toISOString() : '',
          type: 'box' as const,
          label: 'Box added',
          detail: box.type ?? '',
          hiveName: h.name,
          Icon: PackagePlus,
        })),
    );
};

// ---------------------------------------------------------------------------
// Marker reference line
// ---------------------------------------------------------------------------

interface MarkerLabelProps {
  // Recharts passes a `viewBox` to label render functions.
  viewBox?: { x?: number; y?: number };
}

const renderMarkerLabel = (
  marker: ChartMarker,
  onEnter: (marker: ChartMarker, e: MouseEvent<SVGElement>) => void,
  onLeave: () => void,
  props: MarkerLabelProps,
) => {
  const Icon = marker.Icon;
  return (
    <g
      transform={`translate(${props.viewBox?.x ?? 0},${
        (props.viewBox?.y ?? 0) - 20
      })`}
      onMouseEnter={e => onEnter(marker, e)}
      onMouseLeave={onLeave}
      style={{ cursor: 'default' }}
    >
      <Icon size={14} x={-7} y={-7} color="var(--muted-foreground)" />
    </g>
  );
};

const MarkerReferenceLine = ({
  marker,
  yAxisId,
  onEnter,
  onLeave,
}: {
  marker: ChartMarker;
  yAxisId: SeriesAxis;
  onEnter: (marker: ChartMarker, e: MouseEvent<SVGElement>) => void;
  onLeave: () => void;
}) => (
  <ReferenceLine
    x={marker.timestamp}
    yAxisId={yAxisId}
    stroke="var(--border)"
    strokeDasharray="4 2"
    label={(props: MarkerLabelProps) =>
      renderMarkerLabel(marker, onEnter, onLeave, props)
    }
  />
);

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

interface HiveScaleDiagramPanelProps {
  selectedDevice: HiveScaleDevice;
  measurements: HiveScaleMeasurement[] | undefined;
  isLoading: boolean;
  dateRange: HiveScaleDateRange;
  onDateRangeChange: (range: HiveScaleDateRange) => void;
  scale1Name: string;
  scale2Name: string;
  hives?: HiveWithBoxesResponse[];
  inspections?: InspectionResponse[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const HiveScaleDiagramPanel = ({
  selectedDevice,
  measurements,
  isLoading,
  dateRange,
  onDateRangeChange,
  scale1Name,
  scale2Name,
  hives,
  inspections,
}: HiveScaleDiagramPanelProps) => {
  const [diagramSettings, setDiagramSettings] = useState<StoredDiagramSettings>(
    () => loadDiagramSettings(selectedDevice.device_id),
  );

  const { visibleSeries, axes: axisScaleSettings } = diagramSettings;

  const [hoveredMarker, setHoveredMarker] = useState<{
    marker: ChartMarker;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    saveDiagramSettings(selectedDevice.device_id, diagramSettings);
  }, [selectedDevice.device_id, diagramSettings]);

  // If device changes, reload settings
  useEffect(() => {
    setDiagramSettings(loadDiagramSettings(selectedDevice.device_id));
  }, [selectedDevice.device_id]);

  const series = useMemo<DiagramSeries[]>(
    () => [
      // -------------------------------------------------------------------
      // Column 1 — Hive 1 (scale 1). Mic LEFT is always hive 1.
      // -------------------------------------------------------------------
      {
        key: 'scale1Weight',
        label: `${scale1Name} weight`,
        dataKey: 'scale1Weight',
        axis: 'weight',
        unit: 'kg',
        stroke: 'var(--primary)',
        group: scale1Name,
        column: 1,
        subgroup: scale1Name,
      },
      {
        key: 'scale1Temperature',
        label: `${scale1Name} temp`,
        dataKey: 'scale1Temperature',
        axis: 'temperature',
        unit: '°C',
        stroke: 'var(--chart-2)',
        group: scale1Name,
        column: 1,
        subgroup: scale1Name,
      },
      {
        key: 'micLeftRms',
        label: `${scale1Name} mic RMS`,
        dataKey: 'micLeftRms',
        axis: 'dbfs',
        unit: 'dBFS',
        stroke: 'var(--chart-1)',
        group: scale1Name,
        column: 1,
        subgroup: scale1Name,
      },
      {
        key: 'beeCounter1In',
        label: `${scale1Name} bees in`,
        dataKey: 'beeCounter1In',
        axis: 'beecount',
        unit: 'bees',
        stroke: 'var(--chart-3)',
        group: scale1Name,
        column: 1,
        subgroup: scale1Name,
      },
      {
        key: 'beeCounter1Out',
        label: `${scale1Name} bees out`,
        dataKey: 'beeCounter1Out',
        axis: 'beecount',
        unit: 'bees',
        stroke: 'var(--chart-4)',
        group: scale1Name,
        column: 1,
        subgroup: scale1Name,
      },
      {
        key: 'beeCounter1Net',
        label: `${scale1Name} net flow`,
        dataKey: 'beeCounter1Net',
        axis: 'beecount',
        unit: 'bees',
        stroke: 'var(--chart-5)',
        group: scale1Name,
        column: 1,
        subgroup: scale1Name,
      },
      // -------------------------------------------------------------------
      // Column 2 — Hive 2 (scale 2). Mic RIGHT is always hive 2.
      // -------------------------------------------------------------------
      {
        key: 'scale2Weight',
        label: `${scale2Name} weight`,
        dataKey: 'scale2Weight',
        axis: 'weight',
        unit: 'kg',
        stroke: 'var(--muted-foreground)',
        group: scale2Name,
        column: 2,
        subgroup: scale2Name,
      },
      {
        key: 'scale2Temperature',
        label: `${scale2Name} temp`,
        dataKey: 'scale2Temperature',
        axis: 'temperature',
        unit: '°C',
        stroke: 'var(--chart-4)',
        group: scale2Name,
        column: 2,
        subgroup: scale2Name,
      },
      {
        key: 'micRightRms',
        label: `${scale2Name} mic RMS`,
        dataKey: 'micRightRms',
        axis: 'dbfs',
        unit: 'dBFS',
        stroke: 'var(--chart-2)',
        group: scale2Name,
        column: 2,
        subgroup: scale2Name,
      },
      {
        key: 'beeCounter2In',
        label: `${scale2Name} bees in`,
        dataKey: 'beeCounter2In',
        axis: 'beecount',
        unit: 'bees',
        stroke: 'var(--chart-3)',
        group: scale2Name,
        column: 2,
        subgroup: scale2Name,
      },
      {
        key: 'beeCounter2Out',
        label: `${scale2Name} bees out`,
        dataKey: 'beeCounter2Out',
        axis: 'beecount',
        unit: 'bees',
        stroke: 'var(--chart-5)',
        group: scale2Name,
        column: 2,
        subgroup: scale2Name,
      },
      {
        key: 'beeCounter2Net',
        label: `${scale2Name} net flow`,
        dataKey: 'beeCounter2Net',
        axis: 'beecount',
        unit: 'bees',
        stroke: 'var(--primary)',
        group: scale2Name,
        column: 2,
        subgroup: scale2Name,
      },
      // -------------------------------------------------------------------
      // Column 3 — Ambient + Off-grid.
      // -------------------------------------------------------------------
      {
        key: 'ambientTemperature',
        label: 'Ambient temp',
        dataKey: 'ambientTemperature',
        axis: 'temperature',
        unit: '°C',
        stroke: 'var(--chart-5)',
        group: 'Ambient',
        column: 3,
        subgroup: 'Ambient',
      },
      {
        key: 'ambientHumidity',
        label: 'Ambient humidity',
        dataKey: 'ambientHumidity',
        axis: 'humidity',
        unit: '%',
        stroke: 'var(--chart-3)',
        group: 'Ambient',
        column: 3,
        subgroup: 'Ambient',
      },
      {
        key: 'batteryVoltage',
        label: 'Battery voltage',
        dataKey: 'batteryVoltage',
        axis: 'voltage',
        unit: 'V',
        stroke: 'var(--destructive)',
        group: 'Off-grid',
        column: 3,
        subgroup: 'Off-grid',
      },
      {
        key: 'batterySoc',
        label: 'Battery charge',
        dataKey: 'batterySoc',
        axis: 'percent',
        unit: '%',
        stroke: 'var(--chart-1)',
        group: 'Off-grid',
        column: 3,
        subgroup: 'Off-grid',
      },
      {
        key: 'solarLoadVoltage',
        label: 'Solar voltage',
        dataKey: 'solarLoadVoltage',
        axis: 'voltage',
        unit: 'V',
        stroke: 'var(--chart-2)',
        group: 'Off-grid',
        column: 3,
        subgroup: 'Off-grid',
      },
      {
        key: 'solarCurrent',
        label: 'Solar current',
        dataKey: 'solarCurrent',
        axis: 'current',
        unit: 'mA',
        stroke: 'var(--chart-3)',
        group: 'Off-grid',
        column: 3,
        subgroup: 'Off-grid',
      },
      {
        key: 'solarPower',
        label: 'Solar power',
        dataKey: 'solarPower',
        axis: 'power',
        unit: 'mW',
        stroke: 'var(--chart-4)',
        group: 'Off-grid',
        column: 3,
        subgroup: 'Off-grid',
      },
    ],
    [scale1Name, scale2Name],
  );

  const activeSeries = useMemo(
    () => series.filter(item => visibleSeries[item.key]),
    [series, visibleSeries],
  );
  const activeAxes = useMemo(
    () => new Set(activeSeries.map(item => item.axis)),
    [activeSeries],
  );

  const chartData = useMemo(
    () =>
      [...(measurements ?? [])]
        .sort(
          (a, b) =>
            new Date(a.measured_at).getTime() -
            new Date(b.measured_at).getTime(),
        )
        .map(item => {
          const bc1In = toFiniteNumber(item.bee_counter_1_interval_in);
          const bc1Out = toFiniteNumber(item.bee_counter_1_interval_out);
          const bc2In = toFiniteNumber(item.bee_counter_2_interval_in);
          const bc2Out = toFiniteNumber(item.bee_counter_2_interval_out);
          // Only emit net if both in and out are available
          const bc1Net =
            bc1In !== null && bc1Out !== null ? bc1In - bc1Out : null;
          const bc2Net =
            bc2In !== null && bc2Out !== null ? bc2In - bc2Out : null;
          // Zero-counts from an ok counter are valid; only suppress if counter is not ok
          const counter1Ok = item.bee_counter_1_ok !== false;
          const counter2Ok = item.bee_counter_2_ok !== false;
          return {
            timestamp: new Date(item.measured_at).getTime(),
            measuredAt: item.measured_at,
            scale1Weight: toFiniteNumber(item.scale_1_weight_kg),
            scale2Weight: toFiniteNumber(item.scale_2_weight_kg),
            scale1Temperature: cleanTemperature(item.hive_1_temp_c),
            scale2Temperature: cleanTemperature(item.hive_2_temp_c),
            ambientTemperature: cleanTemperature(item.ambient_temp_c),
            ambientHumidity: toFiniteNumber(item.ambient_humidity_percent),
            batteryVoltage: toFiniteNumber(
              item.battery_voltage_v ?? item.battery_voltage,
            ),
            batterySoc: toFiniteNumber(item.battery_soc_percent),
            solarLoadVoltage: toFiniteNumber(item.solar_load_voltage_v),
            solarCurrent: toFiniteNumber(item.solar_current_ma),
            solarPower: toFiniteNumber(item.solar_power_mw),
            micLeftRms: toFiniteNumber(item.mic_left_rms_dbfs),
            micRightRms: toFiniteNumber(item.mic_right_rms_dbfs),
            beeCounter1In: counter1Ok ? bc1In : null,
            beeCounter1Out: counter1Ok ? bc1Out : null,
            beeCounter1Net: counter1Ok ? bc1Net : null,
            beeCounter2In: counter2Ok ? bc2In : null,
            beeCounter2Out: counter2Ok ? bc2Out : null,
            beeCounter2Net: counter2Ok ? bc2Net : null,
          };
        })
        .filter(item => Number.isFinite(item.timestamp)),
    [measurements],
  );

  const visibleChartData = useMemo(() => {
    const startMs = dateRange.startAt
      ? new Date(dateRange.startAt).getTime()
      : null;
    const endMs = dateRange.endAt ? new Date(dateRange.endAt).getTime() : null;
    if (!startMs && !endMs) return chartData;
    return chartData.filter(item => {
      if (startMs && item.timestamp < startMs) return false;
      if (endMs && item.timestamp > endMs) return false;
      return true;
    });
  }, [chartData, dateRange]);

  const axisDomains = useMemo(() => {
    const domains: Partial<Record<SeriesAxis, AxisDomain | undefined>> = {};
    for (const axis of axisOrder) {
      if (!activeAxes.has(axis)) continue;
      const axisSeriesKeys = activeSeries
        .filter(s => s.axis === axis)
        .map(s => s.dataKey);
      const values = visibleChartData.flatMap(d =>
        axisSeriesKeys.map(k => d[k as keyof typeof d]),
      );
      domains[axis] = getAxisDomain(axisScaleSettings[axis], values);
    }
    return domains;
  }, [activeAxes, activeSeries, axisScaleSettings, visibleChartData]);

  const mappedHives = useMemo(() => {
    const hiveList = hives ?? [];
    const names = [normalizeName(scale1Name), normalizeName(scale2Name)].filter(
      Boolean,
    );
    return hiveList.filter(hive => names.includes(normalizeName(hive.name)));
  }, [hives, scale1Name, scale2Name]);

  const markers = useMemo(() => {
    const hiveList = hives ?? [];
    const mappedHiveIds = mappedHives.map(hive => hive.id);
    return [
      ...buildInspectionMarkers(inspections, hiveList, mappedHiveIds),
      ...buildBoxAddedMarkers(
        hiveList,
        mappedHiveIds,
        dateRange.startAt,
        dateRange.endAt,
      ),
    ].sort((a, b) => a.timestamp - b.timestamp);
  }, [dateRange.endAt, dateRange.startAt, hives, inspections, mappedHives]);

  const toggleSeries = (key: SeriesKey) => {
    setDiagramSettings(current => ({
      ...current,
      visibleSeries: {
        ...current.visibleSeries,
        [key]: !current.visibleSeries[key],
      },
    }));
  };

  const updateAxisScaleSettings = (
    axis: SeriesAxis,
    updates: Partial<AxisScaleSettings>,
  ) => {
    setDiagramSettings(current => ({
      ...current,
      axes: {
        ...current.axes,
        [axis]: { ...current.axes[axis], ...updates },
      },
    }));
  };

  const resetAxisLayout = () => {
    setDiagramSettings(getDefaultDiagramSettings());
  };

  const downloadVisibleDataCsv = () => {
    if (!visibleChartData.length || !activeSeries.length) return;

    const headers = [
      'measured_at',
      'timestamp',
      ...activeSeries.map(item => `${item.label} (${item.unit})`),
    ];
    const rows = visibleChartData.map(item => [
      item.measuredAt,
      new Date(item.timestamp).toISOString(),
      ...activeSeries.map(seriesItem => {
        const value = item[seriesItem.dataKey as keyof typeof item];
        return typeof value === 'number' && Number.isFinite(value)
          ? value.toString()
          : '';
      }),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsvField).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hivescale-${selectedDevice.device_id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hideMarkerTooltip = () => setHoveredMarker(null);

  const handleMarkerMouseEnter = (
    marker: ChartMarker,
    e: MouseEvent<SVGElement>,
  ) => {
    setHoveredMarker({ marker, x: e.clientX, y: e.clientY });
  };

  // Group series into the three fixed columns, preserving series order and
  // splitting each column into its sub-headed sections.
  const columns = useMemo(() => {
    const byColumn: Record<
      1 | 2 | 3,
      { subgroup: string; items: DiagramSeries[] }[]
    > = {
      1: [],
      2: [],
      3: [],
    };
    for (const s of series) {
      const colSections = byColumn[s.column];
      let section = colSections[colSections.length - 1];
      if (!section || section.subgroup !== s.subgroup) {
        section = { subgroup: s.subgroup, items: [] };
        colSections.push(section);
      }
      section.items.push(s);
    }
    return byColumn;
  }, [series]);

  // Timestamp of the most recent measurement in the loaded range, used for the
  // "last data" line in the header.
  const lastDataAt = useMemo<string | null>(() => {
    if (!measurements?.length) return null;
    let latest = -Infinity;
    for (const m of measurements) {
      const ts = new Date(m.measured_at).getTime();
      if (Number.isFinite(ts) && ts > latest) latest = ts;
    }
    return latest === -Infinity ? null : new Date(latest).toISOString();
  }, [measurements]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Measurements</CardTitle>
            <CardDescription>
              Weight, temperature, and entrance activity over time
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">Device:</span>{' '}
                {selectedDevice.display_name ?? selectedDevice.device_id}
              </span>
              <span>
                <span className="font-medium text-foreground">Last seen:</span>{' '}
                {formatRelativeTime(selectedDevice.last_seen_at)}
              </span>
              <span>
                <span className="font-medium text-foreground">Last data:</span>{' '}
                {formatRelativeTime(lastDataAt)}
              </span>
              <span>
                <span className="font-medium text-foreground">Firmware:</span>{' '}
                {selectedDevice.last_firmware_version ?? '—'}
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={downloadVisibleDataCsv}
            disabled={!visibleChartData.length || !activeSeries.length}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            CSV
          </Button>
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-end gap-2 pt-2">
          <div className="flex flex-wrap gap-1">
            {(
              [
                '24h',
                '7d',
                '30d',
                '365d',
                'currentYear',
                'all',
              ] as HiveScaleDateRangePreset[]
            ).map(preset => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant={
                  dateRange.preset === preset && dateRange.preset !== 'custom'
                    ? 'default'
                    : 'outline'
                }
                onClick={() => onDateRangeChange(createPresetDateRange(preset))}
              >
                {presetButtonLabel(preset)}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs">From</Label>
            <Input
              type="datetime-local"
              className="h-8 w-44 text-xs"
              value={dateRange.startAt?.slice(0, 16) ?? ''}
              onChange={e =>
                onDateRangeChange({
                  preset: 'custom',
                  startAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                  endAt: dateRange.endAt,
                })
              }
            />
            <Label className="text-xs">To</Label>
            <Input
              type="datetime-local"
              className="h-8 w-44 text-xs"
              value={dateRange.endAt?.slice(0, 16) ?? ''}
              onChange={e =>
                onDateRangeChange({
                  preset: 'custom',
                  startAt: dateRange.startAt,
                  endAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </div>
        </div>

        {/* Series toggles — fixed 3-column layout */}
        <div className="grid gap-4 pt-2 md:grid-cols-3">
          {([1, 2, 3] as const).map(column => (
            <div key={column} className="space-y-3">
              {columns[column].map(section => (
                <div key={section.subgroup} className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    {section.subgroup}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {section.items.map(s => (
                      <Badge
                        key={s.key}
                        variant={visibleSeries[s.key] ? 'default' : 'outline'}
                        className="cursor-pointer select-none"
                        style={
                          visibleSeries[s.key]
                            ? {
                                backgroundColor: s.stroke,
                                borderColor: s.stroke,
                              }
                            : { borderColor: s.stroke, color: s.stroke }
                        }
                        onClick={() => toggleSeries(s.key)}
                      >
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <BeeLoadingMessages />
        ) : visibleChartData.length ? (
          <div className="h-[28rem]" onMouseLeave={hideMarkerTooltip}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visibleChartData}
                margin={{
                  top: 32,
                  right: axisOrder.some(
                    a =>
                      activeAxes.has(a) &&
                      axisScaleSettings[a].side === 'right',
                  )
                    ? 48
                    : 8,
                  bottom: 8,
                  left: axisOrder.some(
                    a =>
                      activeAxes.has(a) && axisScaleSettings[a].side === 'left',
                  )
                    ? 8
                    : 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  domain={[
                    dateRange.startAt
                      ? new Date(dateRange.startAt).getTime()
                      : 'dataMin',
                    dateRange.endAt
                      ? new Date(dateRange.endAt).getTime()
                      : 'dataMax',
                  ]}
                  minTickGap={24}
                  scale="time"
                  tickFormatter={formatChartTick}
                  type="number"
                />
                {axisOrder.map(axis => {
                  if (!activeAxes.has(axis)) return null;
                  const { unit } = axisPresentation[axis];
                  const settings = axisScaleSettings[axis];
                  const unitWidths: Partial<Record<SeriesAxis, number>> = {
                    current: 58,
                    power: 62,
                    dbfs: 68,
                    beecount: 62,
                  };
                  return (
                    <YAxis
                      key={axis}
                      yAxisId={axis}
                      orientation={settings.side}
                      unit={` ${unit}`}
                      width={unitWidths[axis] ?? 52}
                      domain={axisDomains[axis]}
                      allowDataOverflow={shouldAllowAxisDataOverflow(settings)}
                    />
                  );
                })}
                <Tooltip
                  labelFormatter={value => formatDateTime(Number(value))}
                  formatter={(value, name) => [value, name]}
                />
                <Legend />
                {markers.map(marker => (
                  <MarkerReferenceLine
                    key={marker.id}
                    marker={marker}
                    yAxisId={activeSeries[0]?.axis ?? 'weight'}
                    onEnter={handleMarkerMouseEnter}
                    onLeave={hideMarkerTooltip}
                  />
                ))}
                {activeSeries.map(s => (
                  <Line
                    key={s.key}
                    yAxisId={s.axis}
                    type="monotone"
                    dataKey={s.dataKey}
                    name={s.label}
                    stroke={s.stroke}
                    dot={false}
                    connectNulls={false}
                    strokeWidth={1.5}
                    unit={` ${s.unit}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No measurements for the selected range.
          </div>
        )}

        {/* Marker tooltip rendered as a portal-like fixed overlay */}
        {hoveredMarker && (
          <div
            className="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-2 text-sm shadow-md"
            style={{
              left: hoveredMarker.x + 12,
              top: hoveredMarker.y - 8,
            }}
          >
            <div className="font-medium">{hoveredMarker.marker.label}</div>
            <div className="text-muted-foreground">
              {hoveredMarker.marker.hiveName}
            </div>
            {hoveredMarker.marker.detail && (
              <div className="text-muted-foreground">
                {hoveredMarker.marker.detail}
              </div>
            )}
            <div className="text-muted-foreground">
              {formatDateTime(hoveredMarker.marker.timestamp)}
            </div>
          </div>
        )}

        {/* Axis scale settings */}
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Axis settings</div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetAxisLayout}
            >
              Reset
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {axisOrder.map(axis => {
              if (!activeAxes.has(axis)) return null;
              const { label, Icon } = axisPresentation[axis];
              const settings = axisScaleSettings[axis];
              return (
                <div key={axis} className="space-y-2 rounded-md border p-2">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="w-8 text-xs text-muted-foreground">
                      Side
                    </Label>
                    <Select
                      value={settings.side}
                      onValueChange={value =>
                        updateAxisScaleSettings(axis, {
                          side: value as 'left' | 'right',
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="w-8 text-xs text-muted-foreground">
                      Scale
                    </Label>
                    <Select
                      value={settings.scaleMode}
                      onValueChange={value =>
                        updateAxisScaleSettings(axis, {
                          scaleMode: value as AxisScaleMode,
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maxRange">Auto</SelectItem>
                        <SelectItem value="zeroToMax">0 to max</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {settings.scaleMode === 'custom' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Label className="w-8 text-xs text-muted-foreground">
                          Min
                        </Label>
                        <Input
                          className="h-7 text-xs"
                          placeholder="auto"
                          value={settings.customMin}
                          onChange={e =>
                            updateAxisScaleSettings(axis, {
                              customMin: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Label className="w-8 text-xs text-muted-foreground">
                          Max
                        </Label>
                        <Input
                          className="h-7 text-xs"
                          placeholder="auto"
                          value={settings.customMax}
                          onChange={e =>
                            updateAxisScaleSettings(axis, {
                              customMax: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
