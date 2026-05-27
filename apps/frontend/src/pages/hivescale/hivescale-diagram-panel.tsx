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
import { Skeleton } from '@/components/ui/skeleton';
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
  | 'dbfs';

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
  | 'micRightRms';

interface DiagramSeries {
  key: SeriesKey;
  label: string;
  dataKey: string;
  axis: SeriesAxis;
  unit: string;
  stroke: string;
  group: string;
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
  version: 4;
  visibleSeries: VisibleSeriesMap;
  axes: AxisScaleSettingsMap;
}

const diagramSettingsStoragePrefix = 'hivepal:hivescale-diagram:';

const defaultVisibleSeries: VisibleSeriesMap = {
  scale1Weight: true,
  scale1Temperature: false,
  scale2Weight: true,
  scale2Temperature: false,
  ambientTemperature: false,
  ambientHumidity: false,
  batteryVoltage: false,
  batterySoc: false,
  solarLoadVoltage: false,
  solarCurrent: false,
  solarPower: false,
  micLeftRms: false,
  micRightRms: false,
};

const defaultAxisScaleSettings: AxisScaleSettingsMap = {
  weight: {
    scaleMode: 'maxRange',
    customMin: '',
    customMax: '',
    side: 'left',
  },
  temperature: {
    scaleMode: 'maxRange',
    customMin: '',
    customMax: '',
    side: 'right',
  },
  humidity: {
    scaleMode: 'maxRange',
    customMin: '',
    customMax: '',
    side: 'right',
  },
  voltage: {
    scaleMode: 'maxRange',
    customMin: '',
    customMax: '',
    side: 'right',
  },
  percent: {
    scaleMode: 'maxRange',
    customMin: '',
    customMax: '',
    side: 'right',
  },
  current: {
    scaleMode: 'maxRange',
    customMin: '',
    customMax: '',
    side: 'right',
  },
  power: {
    scaleMode: 'maxRange',
    customMin: '',
    customMax: '',
    side: 'right',
  },
  dbfs: {
    scaleMode: 'maxRange',
    customMin: '',
    customMax: '',
    side: 'right',
  },
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
];

const axisPresentation: Record<
  SeriesAxis,
  { label: string; unit: string; side: 'left' | 'right'; Icon: LucideIcon }
> = {
  weight: { label: 'Weight', unit: 'kg', side: 'left', Icon: Scale },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    side: 'right',
    Icon: Thermometer,
  },
  humidity: { label: 'Humidity', unit: '%', side: 'right', Icon: Droplets },
  voltage: { label: 'Voltage', unit: 'V', side: 'right', Icon: Battery },
  percent: { label: 'Percent', unit: '%', side: 'right', Icon: Activity },
  current: { label: 'Current', unit: 'mA', side: 'right', Icon: Zap },
  power: { label: 'Power', unit: 'mW', side: 'right', Icon: Sun },
  dbfs: { label: 'Sound', unit: 'dBFS', side: 'right', Icon: Activity },
};

interface MarkerTooltipState {
  marker: ChartMarker;
  x: number;
  y: number;
}

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

const formatCsvFilenameDate = (date: Date) =>
  date.toISOString().slice(0, 10);

const safeFilenameSegment = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_');

const escapeCsvValue = (value: unknown): string => {
  const str = String(value ?? '');
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
      const customMin = parseFloat(settings.customMin);
      const customMax = parseFloat(settings.customMax);
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

export const measurementLimitForRange = (range: HiveScaleDateRange): number => {
  switch (range.preset) {
    case '24h':
      return 288; // 5-min intervals
    case '7d':
      return 336; // 30-min intervals
    case '30d':
      return 360; // 2-hour intervals
    case '365d':
    case 'currentYear':
      return 365; // daily
    case 'all':
    case 'custom':
      return 500;
    default:
      return 500;
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
        startAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    case '30d':
      return {
        preset,
        startAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    case '365d':
      return {
        preset,
        startAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
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
      return { preset: '7d', startAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() };
  }
};

const mergeVisibleSeries = (value: unknown): VisibleSeriesMap => ({
  ...defaultVisibleSeries,
  ...(value && typeof value === 'object'
    ? (value as Partial<VisibleSeriesMap>)
    : {}),
});

const mergeAxisScaleSettings = (value: unknown): AxisScaleSettingsMap => {
  const record =
    value && typeof value === 'object'
      ? (value as Partial<Record<SeriesAxis, Partial<AxisScaleSettings>>>)
      : {};

  return axisOrder.reduce((acc, axis) => {
    const current = record[axis] ?? {};
    const defaultSide = axisPresentation[axis].side;
    acc[axis] = {
      scaleMode:
        current.scaleMode === 'zeroToMax' || current.scaleMode === 'custom'
          ? current.scaleMode
          : 'maxRange',
      customMin: String(current.customMin ?? ''),
      customMax: String(current.customMax ?? ''),
      side: current.side === 'left' || current.side === 'right' ? current.side : defaultSide,
    };
    return acc;
  }, {} as AxisScaleSettingsMap);
};

const getDefaultDiagramSettings = (): StoredDiagramSettings => ({
  version: 4,
  visibleSeries: defaultVisibleSeries,
  axes: defaultAxisScaleSettings,
});

const loadStoredDiagramSettings = (
  storageKey: string,
): StoredDiagramSettings => {
  if (typeof window === 'undefined') return getDefaultDiagramSettings();

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return getDefaultDiagramSettings();

    const parsed = JSON.parse(raw) as Partial<StoredDiagramSettings>;
    // Version 2 → 3: side was not persisted.
    // Version 3 → 4: added micLeftRms / micRightRms series and dbfs axis.
    // mergeVisibleSeries and mergeAxisScaleSettings handle missing keys gracefully.
    return {
      version: 4,
      visibleSeries: mergeVisibleSeries(parsed.visibleSeries),
      axes: mergeAxisScaleSettings(parsed.axes),
    };
  } catch {
    return getDefaultDiagramSettings();
  }
};

const normalizeName = (value: string | null | undefined) =>
  (value ?? '').trim().toLowerCase();

const detailText = (details: unknown, keys: string[]) => {
  if (!details || typeof details !== 'object') return '';
  const record = details as Record<string, unknown>;
  return keys
    .map(key => {
      const value = record[key];
      if (value === undefined || value === null || value === '')
        return undefined;
      return `${key}: ${String(value)}`;
    })
    .filter(Boolean)
    .join(' · ');
};

const getHiveName = (hives: HiveWithBoxesResponse[], hiveId: string) =>
  hives.find(hive => hive.id === hiveId)?.name ?? hiveId;

const buildInspectionMarkers = (
  inspections: InspectionResponse[] | undefined,
  hives: HiveWithBoxesResponse[],
  mappedHiveIds: string[],
): ChartMarker[] => {
  if (!inspections) return [];
  return inspections
    .filter(inspection => mappedHiveIds.includes(inspection.hiveId))
    .map(inspection => {
      const type = inspection.type ?? 'inspection';
      const hiveName = getHiveName(hives, inspection.hiveId);

      let Icon: LucideIcon = ClipboardCheck;
      let markerType: ChartMarker['type'] = 'inspection';
      let label = 'Inspection';

      if (inspection.actions?.some(a => a.type === ActionType.Feeding)) {
        Icon = Utensils;
        markerType = 'feeding';
        label = 'Feeding';
      } else if (inspection.actions?.some(a => a.type === ActionType.Treatment)) {
        Icon = Pill;
        markerType = 'treatment';
        label = 'Treatment';
      } else if (inspection.actions?.some(a => a.type === ActionType.Maintenance)) {
        Icon = Wrench;
        markerType = 'maintenance';
        label = 'Maintenance';
      } else if (inspection.actions?.some(a => a.type === ActionType.FrameChange)) {
        Icon = Frame;
        markerType = 'frames';
        label = 'Frame change';
      }

      const detail = detailText(inspection.details, ['weight', 'temper', 'strength']);

      return {
        id: inspection.id,
        timestamp: new Date(inspection.inspectedAt).getTime(),
        date: inspection.inspectedAt,
        type: markerType,
        label,
        detail,
        hiveName,
        Icon,
      };
    });
};

const buildBoxAddedMarkers = (
  hives: HiveWithBoxesResponse[],
  mappedHiveIds: string[],
  startAt: string | undefined,
  endAt: string | undefined,
): ChartMarker[] => {
  const startMs = startAt ? new Date(startAt).getTime() : -Infinity;
  const endMs = endAt ? new Date(endAt).getTime() : Infinity;

  return hives
    .filter(hive => mappedHiveIds.includes(hive.id))
    .flatMap(hive =>
      (hive.boxes ?? [])
        .filter(box => {
          if (!box.addedAt) return false;
          const ts = new Date(box.addedAt).getTime();
          return ts >= startMs && ts <= endMs;
        })
        .map(box => ({
          id: `box-${hive.id}-${box.addedAt}`,
          timestamp: new Date(box.addedAt!).getTime(),
          date: box.addedAt!,
          type: 'box' as const,
          label: 'Box added',
          detail: box.type ?? '',
          hiveName: hive.name,
          Icon: PackagePlus,
        })),
    );
};

function MarkerReferenceLineLabel({
  marker,
  row,
  onHover,
  onLeave,
}: {
  marker: ChartMarker;
  row: number;
  onHover: (marker: ChartMarker, event: MouseEvent<SVGGElement>) => void;
  onLeave: () => void;
}) {
  const { Icon } = marker;
  const offsetY = -24 - row * 18;

  return (
    <g
      transform={`translate(0, ${offsetY})`}
      style={{ cursor: 'default' }}
      onMouseEnter={event => onHover(marker, event)}
      onMouseLeave={onLeave}
    >
      <foreignObject x={-10} y={-10} width={20} height={20}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Icon
            style={{
              width: 14,
              height: 14,
              color: 'var(--muted-foreground)',
            }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

// ---------------------------------------------------------------------------
// SeriesToggle — shows an "n/a" badge and reduced opacity when the device has
// no data for this series in its full measurement history. The button remains
// clickable so the stored display configuration is never silently cleared.
// ---------------------------------------------------------------------------
function SeriesToggle({
  series,
  active,
  hasData,
  onToggle,
}: {
  series: DiagramSeries;
  active: boolean;
  hasData: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'rounded-md border px-3 py-2 text-left text-sm transition-colors',
        'flex items-center justify-between gap-2',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-background text-foreground hover:bg-muted',
        !hasData ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span>{series.label}</span>
      {!hasData && (
        <span
          className={[
            'shrink-0 rounded px-1 py-0.5 text-[10px] font-medium leading-none',
            active
              ? 'bg-background/20 text-background'
              : 'bg-muted text-muted-foreground',
          ].join(' ')}
        >
          n/a
        </span>
      )}
    </button>
  );
}

function DateRangeSelector({
  value,
  onChange,
}: {
  value: HiveScaleDateRange;
  onChange: (range: HiveScaleDateRange) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="text-sm font-medium">Date range</div>
      <div className="flex gap-2">
        <Select
          value={value.preset === 'custom' ? 'custom' : value.preset}
          onValueChange={preset => {
            if (preset !== 'custom') {
              onChange(createPresetDateRange(preset as HiveScaleDateRangePreset));
            } else {
              onChange({ preset: 'custom' });
            }
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 hours</SelectItem>
            <SelectItem value="7d">7 days</SelectItem>
            <SelectItem value="30d">30 days</SelectItem>
            <SelectItem value="365d">365 days</SelectItem>
            <SelectItem value="currentYear">Current year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={value.preset === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange({ preset: 'custom' })}
        >
          Custom
        </Button>
      </div>
      {value.preset === 'custom' && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>From</Label>
            <Input
              type="datetime-local"
              value={value.startAt ? value.startAt.slice(0, 16) : ''}
              onChange={e =>
                onChange({
                  ...value,
                  startAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input
              type="datetime-local"
              value={value.endAt ? value.endAt.slice(0, 16) : ''}
              onChange={e =>
                onChange({
                  ...value,
                  endAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const readStoredDateRange = (): HiveScaleDateRange | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('hivepal:hivescale-date-range');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HiveScaleDateRange;
    if (!parsed.preset) return null;
    return parsed;
  } catch {
    return null;
  }
};

export function HiveScaleDiagramPanel({
  selectedDevice,
  measurements,
  isLoading,
  dateRange,
  onDateRangeChange,
  scale1Name,
  scale2Name,
  inspections,
  hives,
}: {
  selectedDevice: HiveScaleDevice;
  measurements: HiveScaleMeasurement[] | undefined;
  isLoading: boolean;
  dateRange: HiveScaleDateRange;
  onDateRangeChange: (range: HiveScaleDateRange) => void;
  scale1Name: string;
  scale2Name: string;
  inspections: InspectionResponse[] | undefined;
  hives: HiveWithBoxesResponse[] | undefined;
}) {
  const storageKey = `${diagramSettingsStoragePrefix}${selectedDevice.device_id}`;
  const [loadedStorageKey, setLoadedStorageKey] = useState(storageKey);
  const [diagramSettings, setDiagramSettings] = useState<StoredDiagramSettings>(
    () => loadStoredDiagramSettings(storageKey),
  );
  const { visibleSeries, axes: axisScaleSettings } = diagramSettings;
  const [hoveredMarker, setHoveredMarker] =
    useState<MarkerTooltipState | null>(null);

  const series = useMemo<DiagramSeries[]>(
    () => [
      {
        key: 'scale1Weight',
        label: `${scale1Name} weight`,
        dataKey: 'scale1Weight',
        axis: 'weight',
        unit: 'kg',
        stroke: 'var(--primary)',
        group: scale1Name,
      },
      {
        key: 'scale1Temperature',
        label: `${scale1Name} temp`,
        dataKey: 'scale1Temperature',
        axis: 'temperature',
        unit: '°C',
        stroke: 'var(--chart-2)',
        group: scale1Name,
      },
      {
        key: 'scale2Weight',
        label: `${scale2Name} weight`,
        dataKey: 'scale2Weight',
        axis: 'weight',
        unit: 'kg',
        stroke: 'var(--muted-foreground)',
        group: scale2Name,
      },
      {
        key: 'scale2Temperature',
        label: `${scale2Name} temp`,
        dataKey: 'scale2Temperature',
        axis: 'temperature',
        unit: '°C',
        stroke: 'var(--chart-4)',
        group: scale2Name,
      },
      {
        key: 'ambientTemperature',
        label: 'Ambient temp',
        dataKey: 'ambientTemperature',
        axis: 'temperature',
        unit: '°C',
        stroke: 'var(--chart-5)',
        group: 'Ambient',
      },
      {
        key: 'ambientHumidity',
        label: 'Ambient humidity',
        dataKey: 'ambientHumidity',
        axis: 'humidity',
        unit: '%',
        stroke: 'var(--chart-3)',
        group: 'Ambient',
      },
      {
        key: 'batteryVoltage',
        label: 'Battery voltage',
        dataKey: 'batteryVoltage',
        axis: 'voltage',
        unit: 'V',
        stroke: 'var(--destructive)',
        group: 'Off-grid',
      },
      {
        key: 'batterySoc',
        label: 'Battery charge',
        dataKey: 'batterySoc',
        axis: 'percent',
        unit: '%',
        stroke: 'var(--chart-1)',
        group: 'Off-grid',
      },
      {
        key: 'solarLoadVoltage',
        label: 'Solar voltage',
        dataKey: 'solarLoadVoltage',
        axis: 'voltage',
        unit: 'V',
        stroke: 'var(--chart-2)',
        group: 'Off-grid',
      },
      {
        key: 'solarCurrent',
        label: 'Solar current',
        dataKey: 'solarCurrent',
        axis: 'current',
        unit: 'mA',
        stroke: 'var(--chart-3)',
        group: 'Off-grid',
      },
      {
        key: 'solarPower',
        label: 'Solar power',
        dataKey: 'solarPower',
        axis: 'power',
        unit: 'mW',
        stroke: 'var(--chart-4)',
        group: 'Off-grid',
      },
      {
        key: 'micLeftRms',
        label: 'Mic left RMS',
        dataKey: 'micLeftRms',
        axis: 'dbfs',
        unit: 'dBFS',
        stroke: 'var(--chart-1)',
        group: 'Sound',
      },
      {
        key: 'micRightRms',
        label: 'Mic right RMS',
        dataKey: 'micRightRms',
        axis: 'dbfs',
        unit: 'dBFS',
        stroke: 'var(--chart-2)',
        group: 'Sound',
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
        .map(item => ({
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
        }))
        .filter(item => Number.isFinite(item.timestamp)),
    [measurements],
  );

  const visibleChartData = useMemo(() => {
    const startMs = dateRange.startAt
      ? new Date(dateRange.startAt).getTime()
      : Number.NEGATIVE_INFINITY;
    const endMs = dateRange.endAt
      ? new Date(dateRange.endAt).getTime()
      : Number.POSITIVE_INFINITY;

    return chartData.filter(
      item =>
        (!Number.isFinite(startMs) || item.timestamp >= startMs) &&
        (!Number.isFinite(endMs) || item.timestamp <= endMs),
    );
  }, [chartData, dateRange.endAt, dateRange.startAt]);

  // ---------------------------------------------------------------------------
  // Compute which series actually have finite data in the full (unfiltered)
  // chartData. We use the full history rather than the visible window so that
  // the n/a badge doesn't flicker as the user pans/zooms the date range.
  // ---------------------------------------------------------------------------
  const seriesDataPresence = useMemo(() => {
    return Object.fromEntries(
      series.map(item => {
        const key = item.dataKey as keyof (typeof chartData)[number];
        const hasData = chartData.some(
          point =>
            typeof point[key] === 'number' &&
            Number.isFinite(point[key] as number),
        );
        return [item.key, hasData];
      }),
    ) as Record<SeriesKey, boolean>;
  }, [series, chartData]);

  const axisDomains = useMemo(() => {
    return axisOrder.reduce(
      (acc, axis) => {
        const dataKeys = series
          .filter(item => item.axis === axis && visibleSeries[item.key])
          .map(item => item.dataKey as keyof (typeof chartData)[number]);
        const values = visibleChartData.flatMap(item =>
          dataKeys.map(dataKey => item[dataKey]),
        );
        acc[axis] = getAxisDomain(axisScaleSettings[axis], values);
        return acc;
      },
      {} as Record<SeriesAxis, AxisDomain | undefined>,
    );
  }, [axisScaleSettings, series, visibleChartData, visibleSeries]);

  useEffect(() => {
    setDiagramSettings(loadStoredDiagramSettings(storageKey));
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || loadedStorageKey !== storageKey)
      return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(diagramSettings));
    } catch {
      // Ignore storage failures, for example private mode or disabled storage.
    }
  }, [diagramSettings, loadedStorageKey, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        'hivepal:hivescale-date-range',
        JSON.stringify(dateRange),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [dateRange]);

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
          ? value
          : '';
      }),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsvValue).join(','))
      .join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const deviceName = safeFilenameSegment(
      selectedDevice.display_name || selectedDevice.device_id,
    );

    link.href = url;
    link.download = `hivepal-${deviceName}-visible-data-${formatCsvFilenameDate(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const showMarkerTooltip = (
    marker: ChartMarker,
    event: MouseEvent<SVGGElement>,
  ) => {
    setHoveredMarker({
      marker,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const hideMarkerTooltip = () => {
    setHoveredMarker(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>
              {selectedDevice.display_name || selectedDevice.device_id}
            </CardTitle>
            <CardDescription>
              Last seen {formatDateTime(new Date(selectedDevice.last_seen_at).getTime())} · Firmware{' '}
              {selectedDevice.last_firmware_version || 'unknown'}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {activeSeries.length} series selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium">Displayed data</div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={downloadVisibleDataCsv}
                disabled={!visibleChartData.length || !activeSeries.length}
              >
                <Download className="mr-2 h-4 w-4" />
                Download visible data .csv
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {series.map(item => (
                <SeriesToggle
                  key={item.key}
                  series={item}
                  active={visibleSeries[item.key]}
                  hasData={seriesDataPresence[item.key]}
                  onToggle={() => toggleSeries(item.key)}
                />
              ))}
            </div>
          </div>
          <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
        </div>

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : visibleChartData.length ? (
          <div className="h-[28rem]" onMouseLeave={hideMarkerTooltip}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visibleChartData}
                margin={{
                  top: 32,
                  right: axisOrder.some(a => activeAxes.has(a) && axisScaleSettings[a].side === 'right') ? 48 : 8,
                  bottom: 8,
                  left: axisOrder.some(a => activeAxes.has(a) && axisScaleSettings[a].side === 'left') ? 8 : 0,
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
                {markers.map((marker, index) => {
                  const refAxisId = activeSeries[0]?.axis ?? 'weight';
                  // Group markers by timestamp to stack icons vertically
                  const sameTimestampMarkers = markers.filter(
                    m => Math.abs(m.timestamp - marker.timestamp) < 60_000,
                  );
                  const row = sameTimestampMarkers.indexOf(marker);
                  return (
                    <ReferenceLine
                      key={marker.id}
                      x={marker.timestamp}
                      yAxisId={refAxisId}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                      label={
                        <MarkerReferenceLineLabel
                          marker={marker}
                          row={row}
                          onHover={showMarkerTooltip}
                          onLeave={hideMarkerTooltip}
                        />
                      }
                    />
                  );
                })}
                {activeSeries.map(item => (
                  <Line
                    key={item.key}
                    yAxisId={item.axis}
                    type="monotone"
                    dataKey={item.dataKey}
                    name={item.label}
                    stroke={item.stroke}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-96 items-center justify-center text-muted-foreground">
            No data available for the selected range.
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
                    <Icon className="h-3 w-3" />
                    {label}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`axis-side-${axis}`}>Side</Label>
                      <Select
                        value={settings.side}
                        onValueChange={value =>
                          updateAxisScaleSettings(axis, {
                            side: value as 'left' | 'right',
                          })
                        }
                      >
                        <SelectTrigger id={`axis-side-${axis}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`axis-scale-${axis}`}>Scale</Label>
                      <Select
                        value={settings.scaleMode}
                        onValueChange={value =>
                          updateAxisScaleSettings(axis, {
                            scaleMode: value as AxisScaleMode,
                          })
                        }
                      >
                        <SelectTrigger id={`axis-scale-${axis}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maxRange">Auto range</SelectItem>
                          <SelectItem value="zeroToMax">Zero to max</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {settings.scaleMode === 'custom' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor={`axis-min-${axis}`}>Min</Label>
                        <Input
                          id={`axis-min-${axis}`}
                          type="number"
                          placeholder="Auto"
                          value={settings.customMin}
                          onChange={e =>
                            updateAxisScaleSettings(axis, {
                              customMin: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`axis-max-${axis}`}>Max</Label>
                        <Input
                          id={`axis-max-${axis}`}
                          type="number"
                          placeholder="Auto"
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
}