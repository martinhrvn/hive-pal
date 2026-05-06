import { useMemo, useState } from 'react';
import {
  Activity,
  Box,
  CalendarDays,
  ClipboardCheck,
  Droplets,
  Frame,
  Scale,
  PackagePlus,
  Pill,
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

type SeriesAxis = 'weight' | 'temperature' | 'humidity' | 'battery';

type SeriesKey =
  | 'scale1Weight'
  | 'scale1Temperature'
  | 'scale2Weight'
  | 'scale2Temperature'
  | 'ambientTemperature'
  | 'ambientHumidity'
  | 'batteryVoltage';

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
}: {
  viewBox?: { x?: number; y?: number };
  marker: ChartMarker;
  row: number;
}) {
  const x = typeof viewBox?.x === 'number' ? viewBox.x : 0;
  const chartTop = typeof viewBox?.y === 'number' ? viewBox.y : 0;
  const Icon = marker.Icon;

  return (
    <g
      color="var(--foreground)"
      transform={`translate(${x - 10}, ${chartTop + 8 + row * 24})`}
    >
      <title>
        {`${marker.label} · ${marker.hiveName} · ${formatDateTime(marker.date)} · ${marker.detail}`}
      </title>
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
  const [visibleSeries, setVisibleSeries] = useState<
    Record<SeriesKey, boolean>
  >({
    scale1Weight: true,
    scale1Temperature: false,
    scale2Weight: true,
    scale2Temperature: false,
    ambientTemperature: false,
    ambientHumidity: false,
    batteryVoltage: false,
  });

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
        axis: 'battery',
        unit: 'V',
        stroke: 'var(--destructive)',
        group: 'Device',
      },
    ],
    [scale1Name, scale2Name],
  );

  const activeSeries = series.filter(item => visibleSeries[item.key]);
  const showTemperatureAxis = activeSeries.some(
    item => item.axis === 'temperature',
  );
  const showHumidityAxis = activeSeries.some(item => item.axis === 'humidity');
  const showBatteryAxis = activeSeries.some(item => item.axis === 'battery');

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
          scale1Weight: item.scale_1_weight_kg,
          scale2Weight: item.scale_2_weight_kg,
          scale1Temperature: cleanTemperature(item.hive_1_temp_c),
          scale2Temperature: cleanTemperature(item.hive_2_temp_c),
          ambientTemperature: cleanTemperature(item.ambient_temp_c),
          ambientHumidity: item.ambient_humidity_percent,
          batteryVoltage: item.battery_voltage,
        }))
        .filter(item => Number.isFinite(item.timestamp)),
    [measurements],
  );

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
    setVisibleSeries(current => ({ ...current, [key]: !current[key] }));
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
            <div className="text-sm font-medium">Displayed data</div>
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
        ) : chartData.length ? (
          <div className="h-[28rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 32, right: 24, bottom: 8, left: 0 }}
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
                <YAxis yAxisId="weight" orientation="left" unit=" kg" />
                {showTemperatureAxis && (
                  <YAxis
                    yAxisId="temperature"
                    orientation="right"
                    unit=" °C"
                    width={64}
                  />
                )}
                {showHumidityAxis && (
                  <YAxis
                    yAxisId="humidity"
                    orientation="right"
                    unit=" %"
                    width={64}
                  />
                )}
                {showBatteryAxis && (
                  <YAxis
                    yAxisId="battery"
                    orientation="right"
                    unit=" V"
                    width={64}
                  />
                )}
                <Tooltip
                  labelFormatter={value => formatDateTime(Number(value))}
                  formatter={(value, name) => [value, name]}
                />
                <Legend />
                {markers.map((marker, index) => (
                  <ReferenceLine
                    key={marker.id}
                    x={marker.timestamp}
                    yAxisId="weight"
                    stroke="var(--border)"
                    strokeDasharray="4 4"
                    label={
                      <MarkerReferenceLineLabel
                        marker={marker}
                        row={index % 6}
                      />
                    }
                  />
                ))}
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
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Activity className="h-8 w-8" />
            <p>No measurements returned for this device and date range.</p>
          </div>
        )}

        <div className="rounded-md border p-3 text-xs text-muted-foreground">
          <div className="mb-2 font-medium text-foreground">Axis setup</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" /> Left: weight
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" /> Right: temperature{' '}
              {showTemperatureAxis ? '' : '(hidden)'}
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4" /> Right: humidity{' '}
              {showHumidityAxis ? '' : '(hidden)'}
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Right: battery{' '}
              {showBatteryAxis ? '' : '(hidden)'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
