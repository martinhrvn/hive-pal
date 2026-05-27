import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  Activity,
  Battery,
  Box,
  CalendarDays,
  ClipboardCheck,
  Download,
  Droplets,
  Frame,
  Scale,
  PackagePlus,
  Pill,
  Radio,
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
  | 'signal';

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
  | 'cellularCsq';

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
  version: 3;
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
  cellularCsq: false,
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
  signal: {
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
  'signal',
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
  voltage: { label: 'Voltage', unit: 'V', side: 'right', Icon: Zap },
  percent: { label: 'Battery %', unit: '%', side: 'right', Icon: Battery },
  current: { label: 'Solar mA', unit: 'mA', side: 'right', Icon: Sun },
  power: { label: 'Solar mW', unit: 'mW', side: 'right', Icon: Sun },
  signal: { label: 'Cellular CSQ', unit: 'CSQ', side: 'right', Icon: Radio },
};

interface MarkerTooltipState {
  marker: ChartMarker;
  x: number;
  y: number;
}

const presetLabels: Record<HiveScaleDateRangePreset, string> = {
  '24h': '24h',
  '7d': '7 days',
  '30d': '30 days',
  '365d': '1 year',
  currentYear: 'Current year',
  all: 'All data',
  custom: 'Custom',
};

const presetOptions: Exclude<HiveScaleDateRangePreset, 'custom'>[] = [
  '24h',
  '7d',
  '30d',
  '365d',
  'currentYear',
  'all',
];

const presetHours: Partial<Record<HiveScaleDateRangePreset, number>> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
  '365d': 24 * 365,
};

export const createPresetDateRange = (
  preset: Exclude<HiveScaleDateRangePreset, 'custom'> = '24h',
): HiveScaleDateRange => {
  if (preset === 'all') {
    return { preset };
  }

  if (preset === 'currentYear') {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return { preset, startAt: start.toISOString() };
  }

  const end = new Date();
  const start = new Date(
    end.getTime() - (presetHours[preset] ?? 24) * 60 * 60 * 1000,
  );
  return { preset, startAt: start.toISOString() };
};

export const measurementLimitForRange = (range: HiveScaleDateRange) => {
  if (range.preset === '24h') return 750;
  if (range.preset === '7d') return 2500;
  if (range.preset === '30d') return 5000;
  return 10000;
};

const formatChartTick = (value: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatDateTime = (value: string | number | null | undefined) => {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const escapeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) return '';

  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const safeFilenameSegment = (value: string) => {
  const safeValue = value
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return safeValue || 'device';
};

const formatCsvFilenameDate = (date: Date) =>
  date.toISOString().slice(0, 19).replace(/[T:]/g, '-');

const toLocalDateTimeInput = (value: string | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const fromLocalDateTimeInput = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const cleanTemperature = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  // DS18B20 reports -127 C when the sensor is disconnected/unreadable.
  if (value <= -100) return null;
  return value;
};

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseCustomAxisValue = (value: string) => {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const padEqualAxisBounds = (min: number, max: number): AxisDomain => {
  if (min !== max) return [min, max];
  const padding = Math.max(Math.abs(min) * 0.1, 1);
  return [min - padding, max + padding];
};

const roundDownAxisBound = (value: number) => {
  if (value === 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(value)));
  const step = magnitude >= 10 ? magnitude / 10 : 1;
  return Math.floor(value / step) * step;
};

const roundUpAxisBound = (value: number) => {
  if (value === 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(value)));
  const step = magnitude >= 10 ? magnitude / 10 : 1;
  return Math.ceil(value / step) * step;
};

const getAxisDomain = (
  settings: AxisScaleSettings,
  rawValues: unknown[],
): AxisDomain | undefined => {
  if (settings.scaleMode === 'custom') {
    const customMin = parseCustomAxisValue(settings.customMin);
    const customMax = parseCustomAxisValue(settings.customMax);
    if (customMin === undefined || customMax === undefined) return undefined;
    return padEqualAxisBounds(
      Math.min(customMin, customMax),
      Math.max(customMin, customMax),
    );
  }

  const values = rawValues.filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value),
  );
  if (!values.length) return undefined;

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  if (settings.scaleMode === 'zeroToMax') {
    const roundedMax = roundUpAxisBound(Math.max(0, dataMax));
    return [0, roundedMax > 0 ? roundedMax : 1];
  }

  return padEqualAxisBounds(
    roundDownAxisBound(dataMin),
    roundUpAxisBound(dataMax),
  );
};

const shouldAllowAxisDataOverflow = (settings: AxisScaleSettings) =>
  settings.scaleMode === 'custom' || settings.scaleMode === 'zeroToMax';

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
  version: 3,
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
    // Version 2 → 3: side was not persisted; fall back to axisPresentation defaults (handled in mergeAxisScaleSettings).
    return {
      version: 3,
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
  hives.find(hive => hive.id === hiveId)?.name ?? 'Hive';

const markerTooltipTitle = (marker: ChartMarker) =>
  `${marker.label} · ${marker.hiveName} · ${formatDateTime(marker.date)} · ${marker.detail}`;

const actionMarkerFromInspection = (
  inspection: InspectionResponse,
  action: InspectionResponse['actions'][number],
  hiveName: string,
): ChartMarker | null => {
  const base = {
    id: `${inspection.id}-${action.id}`,
    timestamp: new Date(inspection.date).getTime(),
    date: inspection.date,
    hiveName,
  };

  switch (action.type) {
    case ActionType.MAINTENANCE:
      return {
        ...base,
        type: 'maintenance',
        label: 'Maintenance',
        detail:
          detailText(action.details, ['component', 'status']) ||
          action.notes ||
          'Maintenance action',
        Icon: Wrench,
      };
    case ActionType.FEEDING:
      return {
        ...base,
        type: 'feeding',
        label: 'Feeding',
        detail:
          detailText(action.details, [
            'amount',
            'unit',
            'feedType',
            'concentration',
          ]) ||
          action.notes ||
          'Feeding action',
        Icon: Utensils,
      };
    case ActionType.FRAME:
      return {
        ...base,
        type: 'frames',
        label: 'Frames changed',
        detail:
          detailText(action.details, ['quantity']) ||
          action.notes ||
          'Frame action',
        Icon: Frame,
      };
    case ActionType.TREATMENT:
      return {
        ...base,
        type: 'treatment',
        label: 'Treatment',
        detail:
          detailText(action.details, ['product', 'quantity', 'unit']) ||
          action.notes ||
          'Treatment action',
        Icon: Pill,
      };
    case ActionType.BOX_CONFIGURATION:
      return {
        ...base,
        type: 'box',
        label: 'Box configuration',
        detail:
          detailText(action.details, [
            'boxesAdded',
            'boxesRemoved',
            'framesAdded',
            'framesRemoved',
            'totalBoxes',
          ]) ||
          action.notes ||
          'Box configuration changed',
        Icon: PackagePlus,
      };
    default:
      return null;
  }
};

const buildInspectionMarkers = (
  inspections: InspectionResponse[] | undefined,
  hives: HiveWithBoxesResponse[],
  mappedHiveIds: string[],
): ChartMarker[] => {
  if (!inspections?.length || mappedHiveIds.length === 0) return [];
  const mappedHiveIdSet = new Set(mappedHiveIds);

  return inspections
    .filter(inspection => mappedHiveIdSet.has(inspection.hiveId))
    .flatMap(inspection => {
      const hiveName = getHiveName(hives, inspection.hiveId);
      const actionMarkers = inspection.actions
        .map(action => actionMarkerFromInspection(inspection, action, hiveName))
        .filter((marker): marker is ChartMarker => Boolean(marker));

      if (actionMarkers.length) return actionMarkers;

      return [
        {
          id: inspection.id,
          timestamp: new Date(inspection.date).getTime(),
          date: inspection.date,
          type: 'inspection' as const,
          label: 'Inspection',
          detail: inspection.notes || 'Inspection recorded',
          hiveName,
          Icon: ClipboardCheck,
        },
      ];
    })
    .filter(marker => Number.isFinite(marker.timestamp));
};

const buildBoxAddedMarkers = (
  hives: HiveWithBoxesResponse[],
  mappedHiveIds: string[],
  startAt?: string,
  endAt?: string,
): ChartMarker[] => {
  const mappedHiveIdSet = new Set(mappedHiveIds);
  const startMs = startAt
    ? new Date(startAt).getTime()
    : Number.NEGATIVE_INFINITY;
  const endMs = endAt ? new Date(endAt).getTime() : Date.now();

  return hives
    .filter(hive => mappedHiveIdSet.has(hive.id))
    .flatMap(hive =>
      (hive.boxes ?? [])
        .map(box => {
          const addedAt =
            'addedAt' in box ? (box.addedAt as string | undefined) : undefined;
          if (!addedAt) return null;
          const timestamp = new Date(addedAt).getTime();
          if (
            !Number.isFinite(timestamp) ||
            timestamp < startMs ||
            timestamp > endMs
          )
            return null;
          return {
            id: `box-${box.id ?? hive.id}-${timestamp}`,
            timestamp,
            date: addedAt,
            type: 'box' as const,
            label: 'Box added',
            detail: `${box.type.toLowerCase().replace('_', ' ')} box${box.variant ? ` · ${box.variant.toLowerCase().replaceAll('_', ' ')}` : ''}`,
            hiveName: hive.name,
            Icon: Box,
          };
        })
        .filter((marker): marker is ChartMarker => Boolean(marker)),
    );
};

function MarkerReferenceLineLabel({
  viewBox,
  marker,
  row,
  onHover,
  onLeave,
}: {
  viewBox?: { x?: number; y?: number };
  marker: ChartMarker;
  row: number;
  onHover: (marker: ChartMarker, event: MouseEvent<SVGGElement>) => void;
  onLeave: () => void;
}) {
  const x = typeof viewBox?.x === 'number' ? viewBox.x : 0;
  const chartTop = typeof viewBox?.y === 'number' ? viewBox.y : 0;
  const Icon = marker.Icon;
  const title = markerTooltipTitle(marker);

  const handleHover = (event: MouseEvent<SVGGElement>) => {
    onHover(marker, event);
  };

  return (
    <g
      aria-label={title}
      color="var(--foreground)"
      role="img"
      style={{ cursor: 'help', pointerEvents: 'all' }}
      transform={`translate(${x - 10}, ${chartTop + 8 + row * 24})`}
      onMouseEnter={handleHover}
      onMouseMove={handleHover}
      onMouseLeave={onLeave}
    >
      <title>{title}</title>
      <rect
        x={-4}
        y={-4}
        width={28}
        height={28}
        rx={7}
        fill="transparent"
        pointerEvents="all"
        stroke="none"
      />
      <rect
        x={0}
        y={0}
        width={20}
        height={20}
        rx={5}
        fill="var(--background)"
        stroke="var(--border)"
      />
      <Icon x={3} y={3} width={14} height={14} strokeWidth={2} />
    </g>
  );
}

function SeriesToggle({
  series,
  active,
  onToggle,
}: {
  series: DiagramSeries;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      onClick={onToggle}
      className="justify-start"
    >
      {series.label}
    </Button>
  );
}

function DateRangeSelector({
  value,
  onChange,
}: {
  value: HiveScaleDateRange;
  onChange: (value: HiveScaleDateRange) => void;
}) {
  const setPreset = (preset: HiveScaleDateRangePreset) => {
    if (preset === 'custom') {
      const fallbackRange = createPresetDateRange('24h');
      onChange({
        preset: 'custom',
        startAt: value.startAt ?? fallbackRange.startAt,
        endAt: value.endAt ?? fallbackRange.endAt,
      });
      return;
    }

    onChange(createPresetDateRange(preset));
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CalendarDays className="h-4 w-4" />
        Date range
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={value.preset === 'custom' ? undefined : value.preset}
          onValueChange={preset =>
            setPreset(preset as Exclude<HiveScaleDateRangePreset, 'custom'>)
          }
        >
          <SelectTrigger className="sm:flex-1">
            <SelectValue placeholder="Preset range" />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map(preset => (
              <SelectItem key={preset} value={preset}>
                {presetLabels[preset]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={value.preset === 'custom' ? 'default' : 'outline'}
          onClick={() => setPreset('custom')}
        >
          {presetLabels.custom}
        </Button>
      </div>
      {value.preset === 'custom' && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hivescale-range-start">Start</Label>
            <Input
              id="hivescale-range-start"
              type="datetime-local"
              value={toLocalDateTimeInput(value.startAt)}
              onChange={event => {
                const startAt = fromLocalDateTimeInput(event.target.value);
                if (startAt) onChange({ ...value, startAt, preset: 'custom' });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hivescale-range-end">End</Label>
            <Input
              id="hivescale-range-end"
              type="datetime-local"
              value={toLocalDateTimeInput(value.endAt)}
              onChange={event =>
                onChange({
                  ...value,
                  endAt: fromLocalDateTimeInput(event.target.value),
                  preset: 'custom',
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
  onDateRangeChange: (value: HiveScaleDateRange) => void;
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
        key: 'cellularCsq',
        label: 'Cellular signal',
        dataKey: 'cellularCsq',
        axis: 'signal',
        unit: 'CSQ',
        stroke: 'var(--chart-5)',
        group: 'Off-grid',
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
          cellularCsq: toFiniteNumber(item.cellular_csq),
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
        return typeof value === 'number' && Number.isFinite(value) ? value : '';
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
              Last seen {formatDateTime(selectedDevice.last_seen_at)} · Firmware{' '}
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
                    signal: 62,
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
                  return (
                    <ReferenceLine
                      key={marker.id}
                      x={marker.timestamp}
                      yAxisId={refAxisId}
                      stroke="var(--border)"
                      strokeDasharray="4 4"
                      label={
                        <MarkerReferenceLineLabel
                          marker={marker}
                          row={index % 6}
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
                    type="monotone"
                    dataKey={item.dataKey}
                    name={item.label}
                    yAxisId={item.axis}
                    stroke={item.stroke}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {hoveredMarker && (
              <div
                className="pointer-events-none fixed z-50 max-w-xs rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
                style={{
                  left: hoveredMarker.x + 12,
                  top: hoveredMarker.y + 12,
                }}
              >
                <div className="font-medium">{hoveredMarker.marker.label}</div>
                <div className="mt-1 text-muted-foreground">
                  {hoveredMarker.marker.hiveName} ·{' '}
                  {formatDateTime(hoveredMarker.marker.date)}
                </div>
                {hoveredMarker.marker.detail && (
                  <div className="mt-1">{hoveredMarker.marker.detail}</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Activity className="h-8 w-8" />
            <p>No measurements returned for this device and date range.</p>
          </div>
        )}

        <div className="space-y-3 rounded-md border p-3 text-xs text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-foreground">Axis setup</div>
              <div>
                Choose scaling and side (left/right) per vertical axis. Saved in this browser.
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={resetAxisLayout}
            >
              Reset axis to default layout
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {axisOrder.map(axis => {
              const presentation = axisPresentation[axis];
              const Icon = presentation.Icon;
              const isVisible = activeAxes.has(axis);
              const settings = axisScaleSettings[axis];

              return (
                <div
                  key={axis}
                  className="space-y-2 rounded-md border bg-background p-3"
                >
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Icon className="h-4 w-4" />
                    <span>{presentation.label}</span>
                    {!isVisible && (
                      <span className="text-muted-foreground">(hidden)</span>
                    )}
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
                      <Label htmlFor={`axis-scale-${axis}`}>Scaling</Label>
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
                          <SelectItem value="maxRange">Max range</SelectItem>
                          <SelectItem value="zeroToMax">0 to max</SelectItem>
                          <SelectItem value="custom">Custom values</SelectItem>
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
                          inputMode="decimal"
                          value={settings.customMin}
                          onChange={event =>
                            updateAxisScaleSettings(axis, {
                              customMin: event.target.value,
                            })
                          }
                          placeholder="-3"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`axis-max-${axis}`}>Max</Label>
                        <Input
                          id={`axis-max-${axis}`}
                          type="number"
                          inputMode="decimal"
                          value={settings.customMax}
                          onChange={event =>
                            updateAxisScaleSettings(axis, {
                              customMax: event.target.value,
                            })
                          }
                          placeholder="126"
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
