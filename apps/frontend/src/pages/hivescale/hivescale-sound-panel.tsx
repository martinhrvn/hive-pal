import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, ChevronDown, Mic, MicOff } from 'lucide-react';
import {
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
import type { HiveScaleDateRange } from './hivescale-date-range';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FftBand = 'sub_bass' | 'hum' | 'piping' | 'stress' | 'high';

interface BandMeta {
  labelKey: string;
  range: string;
  descriptionKey: string;
  fill: string;
}

const FFT_BANDS: Record<FftBand, BandMeta> = {
  sub_bass: {
    labelKey: 'sound.bands.subBass.label',
    range: '50–150 Hz',
    descriptionKey: 'sound.bands.subBass.description',
    fill: 'var(--chart-5)',
  },
  hum: {
    labelKey: 'sound.bands.hum.label',
    range: '150–300 Hz',
    descriptionKey: 'sound.bands.hum.description',
    fill: 'var(--chart-1)',
  },
  piping: {
    labelKey: 'sound.bands.piping.label',
    range: '300–550 Hz',
    descriptionKey: 'sound.bands.piping.description',
    fill: 'var(--chart-2)',
  },
  stress: {
    labelKey: 'sound.bands.stress.label',
    range: '550–1500 Hz',
    descriptionKey: 'sound.bands.stress.description',
    fill: 'var(--chart-3)',
  },
  high: {
    labelKey: 'sound.bands.high.label',
    range: '1500–3000 Hz',
    descriptionKey: 'sound.bands.high.description',
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
  const { t } = useTranslation('hivescale');
  if (micOk === null || micOk === undefined) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <MicOff className="h-3.5 w-3.5" />
        {t('sound.status.noData')}
      </span>
    );
  }
  if (!micOk) {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <MicOff className="h-3.5 w-3.5" />
        {t('sound.status.micError')}
      </span>
    );
  }
  const both = leftOk !== false && rightOk !== false;
  return (
    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
      <Mic className="h-3.5 w-3.5" />
      {both
        ? t('sound.status.bothActive', { left: leftName, right: rightName })
        : leftOk
          ? t('sound.status.oneActive', { name: leftName })
          : t('sound.status.oneActive', { name: rightName })}
    </span>
  );
}

/**
 * One line series on a dBFS time chart.
 */
interface DbfsSeries {
  dataKey: string;
  name: string;
  stroke: string;
}

/**
 * Clip a timestamped series to the selected date range. Shared by every chart
 * in this panel so the filtering logic lives in one place.
 */
const useVisibleByDateRange = <T extends { timestamp: number }>(
  data: T[],
  dateRange: HiveScaleDateRange,
): T[] =>
  useMemo(() => {
    const startMs = dateRange.startAt
      ? new Date(dateRange.startAt).getTime()
      : Number.NEGATIVE_INFINITY;
    const endMs = dateRange.endAt
      ? new Date(dateRange.endAt).getTime()
      : Number.POSITIVE_INFINITY;
    return data.filter(d => d.timestamp >= startMs && d.timestamp <= endMs);
  }, [data, dateRange]);

/**
 * Centered "no data" placeholder shown when a chart has nothing to plot.
 */
function ChartEmptyState({
  label,
  heightClass = 'h-96',
}: {
  label: string;
  heightClass?: string;
}) {
  return (
    <div
      className={`flex ${heightClass} items-center justify-center text-sm text-muted-foreground`}
    >
      <Activity className="mr-2 h-4 w-4" />
      {label}
    </div>
  );
}

/**
 * Shared dBFS-over-time line chart scaffold (axes, grid, tooltip, legend).
 * Callers pass the already date-filtered data and the line series to draw.
 */
function DbfsTimeChart({
  data,
  dateRange,
  series,
  heightClass = 'h-96',
}: {
  data: { timestamp: number }[];
  dateRange: HiveScaleDateRange;
  series: DbfsSeries[];
  heightClass?: string;
}) {
  return (
    <div className={heightClass}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
          <YAxis unit=" dBFS" width={72} domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={value => formatDateTime(Number(value))}
            formatter={(value, name) => [
              typeof value === 'number' ? `${value.toFixed(1)} dBFS` : '—',
              name,
            ]}
          />
          <Legend />
          {series.map(s => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.stroke}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * FFT band line chart for a single channel over time.
 * Each series is one of the 5 band energies (dBFS) tracked over time.
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
  const { t } = useTranslation('hivescale');
  const visibleData = useVisibleByDateRange(data, dateRange);

  if (!visibleData.length) {
    return (
      <ChartEmptyState label={t('sound.noDataForChannel', { name: emptyLabel })} />
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{channelLabel}</p>
      <DbfsTimeChart
        data={visibleData}
        dateRange={dateRange}
        series={BAND_KEYS.map(band => ({
          dataKey: band,
          name: `${t(FFT_BANDS[band].labelKey)} (${FFT_BANDS[band].range})`,
          stroke: FFT_BANDS[band].fill,
        }))}
      />
    </div>
  );
}

/**
 * RMS sound-level line chart — overall loudness (dBFS) per channel over time.
 * A simpler companion to the FFT band charts for spotting broad changes in
 * colony volume.
 */
function RmsLineChart({
  data,
  leftName,
  rightName,
  dateRange,
}: {
  data: {
    timestamp: number;
    measuredAt: string;
    left: number | null;
    right: number | null;
  }[];
  leftName: string;
  rightName: string;
  dateRange: HiveScaleDateRange;
}) {
  const { t } = useTranslation('hivescale');
  const visibleData = useVisibleByDateRange(data, dateRange);

  if (!visibleData.length) {
    return (
      <ChartEmptyState
        heightClass="h-72"
        label={t('sound.noDataForChannel', {
          name: `${leftName} / ${rightName}`,
        })}
      />
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{t('sound.rmsTitle')}</p>
      <DbfsTimeChart
        data={visibleData}
        dateRange={dateRange}
        heightClass="h-72"
        series={[
          {
            dataKey: 'left',
            name: t('sound.rmsSeries', { name: leftName }),
            stroke: 'var(--chart-1)',
          },
          {
            dataKey: 'right',
            name: t('sound.rmsSeries', { name: rightName }),
            stroke: 'var(--chart-2)',
          },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Band legend / reference table
// ---------------------------------------------------------------------------

function BandReferenceTable() {
  const { t } = useTranslation('hivescale');
  return (
    <div className="rounded-md border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 text-left font-medium">
              {t('sound.table.band')}
            </th>
            <th className="px-3 py-2 text-left font-medium">
              {t('sound.table.range')}
            </th>
            <th className="px-3 py-2 text-left font-medium">
              {t('sound.table.significance')}
            </th>
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
                {t(FFT_BANDS[band].labelKey)}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">
                {FFT_BANDS[band].range}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">
                {t(FFT_BANDS[band].descriptionKey)}
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
  const { t } = useTranslation('hivescale');
  const [isOpen, setIsOpen] = useState(false);
  const [showRms, setShowRms] = useState(false);

  // Map mic channels to hive display names (left = scale 1, right = scale 2),
  // with sensible fallbacks if a name is empty.
  const leftName = scale1Name?.trim() || t('sound.micLeftFallback');
  const rightName = scale2Name?.trim() || t('sound.micRightFallback');

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

  // FFT band line chart data — left channel
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

  // FFT band line chart data — right channel
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

  // RMS sound-level line chart data — both channels on one chart
  const rmsData = useMemo(
    () =>
      sorted
        .map(m => ({
          timestamp: new Date(m.measured_at).getTime(),
          measuredAt: m.measured_at,
          left: toFiniteNumber(m.mic_left_rms_dbfs),
          right: toFiniteNumber(m.mic_right_rms_dbfs),
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
                  {t('sound.title')}
                  <MicStatusBadge
                    micOk={latest?.mic_ok}
                    leftOk={latest?.mic_left_ok}
                    rightOk={latest?.mic_right_ok}
                    leftName={leftName}
                    rightName={rightName}
                  />
                </CardTitle>
                <CardDescription>
                  {t('sound.description', { left: leftName, right: rightName })}
                </CardDescription>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between sm:w-auto sm:min-w-36"
              >
                {isOpen ? t('sound.hide') : t('sound.show')}
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
              <div className="grid gap-6 xl:grid-cols-2">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            ) : (
              <>
                {/* RMS sound-level toggle */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant={showRms ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowRms(prev => !prev)}
                  >
                    {showRms
                      ? t('sound.rmsToggleHide')
                      : t('sound.rmsToggleShow')}
                  </Button>
                </div>

                {/* RMS sound-level chart (both channels) */}
                {showRms && (
                  <>
                    <RmsLineChart
                      data={rmsData}
                      leftName={leftName}
                      rightName={rightName}
                      dateRange={dateRange}
                    />
                    <div className="my-1 border-t" />
                  </>
                )}

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
                    {t('sound.bandReference')}
                  </p>
                  <BandReferenceTable />
                  <p className="text-xs text-muted-foreground">
                    {t('sound.thresholds')}
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
