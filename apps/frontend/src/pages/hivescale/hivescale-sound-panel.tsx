import { useMemo, useState } from 'react';
import { Activity, ChevronDown, Mic, MicOff } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
import { Skeleton } from '@/components/ui/skeleton';
import type { HiveScaleMeasurement } from '@/api/hooks/useHiveScale';
import type { HiveScaleDateRange } from './hivescale-diagram-panel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FftBand = 'sub_bass' | 'hum' | 'piping' | 'stress' | 'high';

interface BandMeta {
  label: string;
  range: string;
  description: string;
  fill: string;
}

const FFT_BANDS: Record<FftBand, BandMeta> = {
  sub_bass: {
    label: 'Sub-bass',
    range: '50–150 Hz',
    description: 'Structural vibration / low rumble',
    fill: 'var(--chart-5)',
  },
  hum: {
    label: 'Hum',
    range: '150–300 Hz',
    description: 'Normal colony hum (~200 Hz fundamental)',
    fill: 'var(--chart-1)',
  },
  piping: {
    label: 'Piping',
    range: '300–550 Hz',
    description: 'Queen piping / tooting (pre-swarm signal)',
    fill: 'var(--chart-2)',
  },
  stress: {
    label: 'Stress',
    range: '550–1500 Hz',
    description: 'Agitated colony / robbing',
    fill: 'var(--chart-3)',
  },
  high: {
    label: 'High',
    range: '1500–3000 Hz',
    description: 'Harmonic overtones',
    fill: 'var(--chart-4)',
  },
};

const BAND_KEYS = Object.keys(FFT_BANDS) as FftBand[];

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

const formatDateTime = (value: string | number | null | undefined) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const toFiniteNumber = (value: number | null | undefined): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
};

const getBandValue = (
  item: HiveScaleMeasurement,
  channel: 'left' | 'right',
  band: FftBand,
): number | null => {
  const key =
    `mic_${channel}_band_${band}_dbfs` as keyof HiveScaleMeasurement;
  return toFiniteNumber(item[key] as number | null | undefined);
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Compact mic status indicator — shown in the card header when collapsed.
 */
function MicStatusBadge({
  micOk,
  leftOk,
  rightOk,
  leftName,
  rightName,
}: {
  micOk: boolean | null | undefined;
  leftOk: boolean | null | undefined;
  rightOk: boolean | null | undefined;
  leftName: string;
  rightName: string;
}) {
  if (micOk === null || micOk === undefined) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <MicOff className="h-3.5 w-3.5" />
        No data
      </span>
    );
  }
  if (!micOk) {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <MicOff className="h-3.5 w-3.5" />
        Mic error
      </span>
    );
  }
  const both = leftOk !== false && rightOk !== false;
  return (
    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
      <Mic className="h-3.5 w-3.5" />
      {both
        ? `${leftName} + ${rightName} active`
        : leftOk
          ? `${leftName} active`
          : `${rightName} active`}
    </span>
  );
}

/**
 * FFT band bar chart for a single channel over time.
 * Each X tick = one measurement; bars are the 5 band energies (dBFS).
 */
function FftBandChart({
  data,
  channelLabel,
  emptyLabel,
  dateRange,
}: {
  data: {
    timestamp: number;
    measuredAt: string;
    sub_bass: number | null;
    hum: number | null;
    piping: number | null;
    stress: number | null;
    high: number | null;
  }[];
  channelLabel: string;
  emptyLabel: string;
  dateRange: HiveScaleDateRange;
}) {
  const visibleData = useMemo(() => {
    const startMs = dateRange.startAt
      ? new Date(dateRange.startAt).getTime()
      : Number.NEGATIVE_INFINITY;
    const endMs = dateRange.endAt
      ? new Date(dateRange.endAt).getTime()
      : Number.POSITIVE_INFINITY;
    return data.filter(
      d => d.timestamp >= startMs && d.timestamp <= endMs,
    );
  }, [data, dateRange]);

  if (!visibleData.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Activity className="mr-2 h-4 w-4" />
        No data for {emptyLabel} in this range.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{channelLabel}</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visibleData}
            margin={{ top: 4, right: 8, bottom: 4, left: 4 }}
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
              scale="time"
              type="number"
              tickFormatter={formatChartTick}
              minTickGap={40}
            />
            <YAxis
              unit=" dBFS"
              width={72}
              domain={['auto', 'auto']}
            />
            <Tooltip
              labelFormatter={value => formatDateTime(Number(value))}
              formatter={(value, name) => [
                typeof value === 'number' ? `${value.toFixed(1)} dBFS` : '—',
                name,
              ]}
            />
            <Legend />
            {BAND_KEYS.map(band => (
              <Bar
                key={band}
                dataKey={band}
                name={`${FFT_BANDS[band].label} (${FFT_BANDS[band].range})`}
                fill={FFT_BANDS[band].fill}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * RMS dBFS line chart for both channels over time (broadband overview).
 */
function RmsLineChart({
  data,
  dateRange,
  leftName,
  rightName,
}: {
  data: {
    timestamp: number;
    measuredAt: string;
    leftRms: number | null;
    rightRms: number | null;
  }[];
  dateRange: HiveScaleDateRange;
  leftName: string;
  rightName: string;
}) {
  const visibleData = useMemo(() => {
    const startMs = dateRange.startAt
      ? new Date(dateRange.startAt).getTime()
      : Number.NEGATIVE_INFINITY;
    const endMs = dateRange.endAt
      ? new Date(dateRange.endAt).getTime()
      : Number.POSITIVE_INFINITY;
    return data.filter(
      d => d.timestamp >= startMs && d.timestamp <= endMs,
    );
  }, [data, dateRange]);

  if (!visibleData.length) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
        <Activity className="mr-2 h-4 w-4" />
        No RMS data in this range.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Broadband RMS (both channels)</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visibleData}
            margin={{ top: 4, right: 8, bottom: 4, left: 4 }}
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
              scale="time"
              type="number"
              tickFormatter={formatChartTick}
              minTickGap={40}
            />
            <YAxis unit=" dBFS" width={72} />
            <Tooltip
              labelFormatter={value => formatDateTime(Number(value))}
              formatter={(value, name) => [
                typeof value === 'number' ? `${value.toFixed(1)} dBFS` : '—',
                name,
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="leftRms"
              name={`${leftName} RMS`}
              stroke="var(--chart-1)"
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="rightRms"
              name={`${rightName} RMS`}
              stroke="var(--chart-2)"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Band legend / reference table
// ---------------------------------------------------------------------------

function BandReferenceTable() {
  return (
    <div className="rounded-md border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 text-left font-medium">Band</th>
            <th className="px-3 py-2 text-left font-medium">Range</th>
            <th className="px-3 py-2 text-left font-medium">Significance</th>
          </tr>
        </thead>
        <tbody>
          {BAND_KEYS.map((band, i) => (
            <tr
              key={band}
              className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
            >
              <td className="px-3 py-1.5 font-medium">
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ background: FFT_BANDS[band].fill }}
                />
                {FFT_BANDS[band].label}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">
                {FFT_BANDS[band].range}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">
                {FFT_BANDS[band].description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function HiveScaleSoundPanel({
  measurements,
  isLoading,
  dateRange,
  scale1Name,
  scale2Name,
}: {
  measurements: HiveScaleMeasurement[] | undefined;
  isLoading: boolean;
  dateRange: HiveScaleDateRange;
  scale1Name: string;
  scale2Name: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Map mic channels to hive display names (left = scale 1, right = scale 2),
  // with sensible fallbacks if a name is empty.
  const leftName = scale1Name?.trim() || 'Mic left';
  const rightName = scale2Name?.trim() || 'Mic right';

  // Derive the latest measurement for the header status badge
  const latest = useMemo(() => {
    if (!measurements?.length) return undefined;
    return [...measurements].sort(
      (a, b) =>
        new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
    )[0];
  }, [measurements]);

  // Only show the panel if at least one measurement has mic data
  const hasMicData = useMemo(
    () =>
      (measurements ?? []).some(
        m =>
          m.mic_ok !== null ||
          m.mic_left_rms_dbfs !== null ||
          m.mic_right_rms_dbfs !== null,
      ),
    [measurements],
  );

  // Pre-sort measurements chronologically once
  const sorted = useMemo(
    () =>
      [...(measurements ?? [])].sort(
        (a, b) =>
          new Date(a.measured_at).getTime() -
          new Date(b.measured_at).getTime(),
      ),
    [measurements],
  );

  // RMS line chart data (both channels)
  const rmsData = useMemo(
    () =>
      sorted
        .map(m => ({
          timestamp: new Date(m.measured_at).getTime(),
          measuredAt: m.measured_at,
          leftRms: toFiniteNumber(m.mic_left_rms_dbfs),
          rightRms: toFiniteNumber(m.mic_right_rms_dbfs),
        }))
        .filter(d => Number.isFinite(d.timestamp)),
    [sorted],
  );

  // FFT band bar chart data — left channel
  const fftLeftData = useMemo(
    () =>
      sorted
        .map(m => ({
          timestamp: new Date(m.measured_at).getTime(),
          measuredAt: m.measured_at,
          sub_bass: getBandValue(m, 'left', 'sub_bass'),
          hum: getBandValue(m, 'left', 'hum'),
          piping: getBandValue(m, 'left', 'piping'),
          stress: getBandValue(m, 'left', 'stress'),
          high: getBandValue(m, 'left', 'high'),
        }))
        .filter(d => Number.isFinite(d.timestamp)),
    [sorted],
  );

  // FFT band bar chart data — right channel
  const fftRightData = useMemo(
    () =>
      sorted
        .map(m => ({
          timestamp: new Date(m.measured_at).getTime(),
          measuredAt: m.measured_at,
          sub_bass: getBandValue(m, 'right', 'sub_bass'),
          hum: getBandValue(m, 'right', 'hum'),
          piping: getBandValue(m, 'right', 'piping'),
          stress: getBandValue(m, 'right', 'stress'),
          high: getBandValue(m, 'right', 'high'),
        }))
        .filter(d => Number.isFinite(d.timestamp)),
    [sorted],
  );

  // Don't render the card at all if there's no mic data and not loading
  if (!isLoading && !hasMicData) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2">
                <Mic className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Hive sound
                  <MicStatusBadge
                    micOk={latest?.mic_ok}
                    leftOk={latest?.mic_left_ok}
                    rightOk={latest?.mic_right_ok}
                    leftName={leftName}
                    rightName={rightName}
                  />
                </CardTitle>
                <CardDescription>
                  INMP441 broadband RMS and FFT band energy (dBFS) —{' '}
                  {leftName} (left) · {rightName} (right)
                </CardDescription>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between sm:w-auto sm:min-w-36"
              >
                {isOpen ? 'Hide sound' : 'Show sound'}
                <ChevronDown
                  className={`ml-2 h-4 w-4 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-52 w-full" />
                <Skeleton className="h-52 w-full" />
              </div>
            ) : (
              <>
                {/* Broadband RMS over time */}
                <RmsLineChart
                  data={rmsData}
                  dateRange={dateRange}
                  leftName={leftName}
                  rightName={rightName}
                />

                <div className="my-1 border-t" />

                {/* FFT band charts per channel */}
                <div className="grid gap-6 xl:grid-cols-2">
                  <FftBandChart
                    data={fftLeftData}
                    channelLabel={leftName}
                    emptyLabel={leftName}
                    dateRange={dateRange}
                  />
                  <FftBandChart
                    data={fftRightData}
                    channelLabel={rightName}
                    emptyLabel={rightName}
                    dateRange={dateRange}
                  />
                </div>

                <div className="my-1 border-t" />

                {/* Reference table */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Band reference
                  </p>
                  <BandReferenceTable />
                  <p className="text-xs text-muted-foreground">
                    Thresholds used by the Insights engine: piping &gt; −45 dBFS,
                    stress &gt; −38 dBFS, queenless hum &gt; −40 dBFS with quiet
                    piping. Calibrate against your own baseline.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
