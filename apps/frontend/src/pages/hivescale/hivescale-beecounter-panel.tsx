import { useMemo, useState } from 'react';
import { Activity, Bug, ChevronDown, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
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
import { Badge } from '@/components/ui/badge';
import type { HiveScaleMeasurement } from '@/api/hooks/useHiveScale';
import type { HiveScaleDateRange } from './hivescale-diagram-panel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CounterHealth {
  ok: boolean;
  numGates: number | null;
  gatesHealthy: number | null;
  glitchCount: number | null;
  latestTotalIn: number | null;
  latestTotalOut: number | null;
}

interface ChartRow {
  timestamp: number;
  measuredAt: string;
  in1: number | null;
  out1: number | null;
  net1: number | null;
  in2: number | null;
  out2: number | null;
  net2: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatTick = (value: number) =>
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

const toFiniteNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface HealthBadgeProps {
  ok: boolean;
  gatesHealthy: number | null;
  numGates: number | null;
  glitchCount: number | null;
}

const HealthBadge = ({
  ok,
  gatesHealthy,
  numGates,
  glitchCount,
}: HealthBadgeProps) => {
  if (!ok) {
    return (
      <Badge variant="destructive" className="text-xs">
        Offline
      </Badge>
    );
  }
  const allHealthy =
    numGates !== null && gatesHealthy !== null && gatesHealthy >= numGates;
  const hasGlitches = glitchCount !== null && glitchCount > 0;

  if (!allHealthy) {
    return (
      <Badge
        variant="outline"
        className="border-amber-400 text-amber-600 text-xs"
      >
        {gatesHealthy ?? '?'}/{numGates ?? '?'} gates
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
        {numGates} gates OK
      </Badge>
      {hasGlitches && (
        <Badge
          variant="outline"
          className="border-yellow-400 text-yellow-600 text-xs"
        >
          {glitchCount} glitch{glitchCount !== 1 ? 'es' : ''}
        </Badge>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number | null;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard = ({ label, value, sub, trend }: StatCardProps) => (
  <div className="rounded-lg border bg-card px-4 py-3">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {trend === 'up' && (
        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
      )}
      {trend === 'down' && (
        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
      )}
    </div>
    <div className="mt-1 text-2xl font-semibold tabular-nums">
      {value !== null && value !== undefined ? value : '—'}
    </div>
    {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HiveScaleBeeCounterPanelProps {
  measurements: HiveScaleMeasurement[] | undefined;
  isLoading: boolean;
  dateRange: HiveScaleDateRange;
  scale1Name: string;
  scale2Name: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const HiveScaleBeeCounterPanel = ({
  measurements,
  isLoading,
  dateRange,
  scale1Name,
  scale2Name,
}: HiveScaleBeeCounterPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeView, setActiveView] = useState<'activity' | 'flow' | 'cumulative'>(
    'activity',
  );

  // Determine which channels have counter data at all
  const hasCounter1 = useMemo(
    () =>
      (measurements ?? []).some(
        m => m.bee_counter_1_ok !== null && m.bee_counter_1_ok !== undefined,
      ),
    [measurements],
  );
  const hasCounter2 = useMemo(
    () =>
      (measurements ?? []).some(
        m => m.bee_counter_2_ok !== null && m.bee_counter_2_ok !== undefined,
      ),
    [measurements],
  );

  // Latest health snapshot
  const health = useMemo<{ ch1: CounterHealth; ch2: CounterHealth }>(() => {
    const sorted = [...(measurements ?? [])].sort(
      (a, b) =>
        new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
    );
    const latest = sorted[0];
    const makeHealth = (ch: 1 | 2): CounterHealth => ({
      ok: latest?.[`bee_counter_${ch}_ok`] === true,
      numGates: toFiniteNumber(latest?.[`bee_counter_${ch}_num_gates`]),
      gatesHealthy: toFiniteNumber(latest?.[`bee_counter_${ch}_gates_healthy`]),
      glitchCount: toFiniteNumber(latest?.[`bee_counter_${ch}_glitch_count`]),
      latestTotalIn: toFiniteNumber(latest?.[`bee_counter_${ch}_total_in`]),
      latestTotalOut: toFiniteNumber(latest?.[`bee_counter_${ch}_total_out`]),
    });
    return { ch1: makeHealth(1), ch2: makeHealth(2) };
  }, [measurements]);

  // Interval totals for the selected date range
  const { totalIn1, totalOut1, totalIn2, totalOut2 } = useMemo(() => {
    const startMs = dateRange.startAt
      ? new Date(dateRange.startAt).getTime()
      : null;
    const endMs = dateRange.endAt ? new Date(dateRange.endAt).getTime() : null;
    let ti1 = 0,
      to1 = 0,
      ti2 = 0,
      to2 = 0;
    for (const m of measurements ?? []) {
      const ts = new Date(m.measured_at).getTime();
      if (startMs && ts < startMs) continue;
      if (endMs && ts > endMs) continue;
      if (m.bee_counter_1_ok !== false) {
        ti1 += toFiniteNumber(m.bee_counter_1_interval_in) ?? 0;
        to1 += toFiniteNumber(m.bee_counter_1_interval_out) ?? 0;
      }
      if (m.bee_counter_2_ok !== false) {
        ti2 += toFiniteNumber(m.bee_counter_2_interval_in) ?? 0;
        to2 += toFiniteNumber(m.bee_counter_2_interval_out) ?? 0;
      }
    }
    return { totalIn1: ti1, totalOut1: to1, totalIn2: ti2, totalOut2: to2 };
  }, [measurements, dateRange]);

  // Chart data
  const chartData = useMemo<ChartRow[]>(() => {
    const startMs = dateRange.startAt
      ? new Date(dateRange.startAt).getTime()
      : null;
    const endMs = dateRange.endAt ? new Date(dateRange.endAt).getTime() : null;

    return [...(measurements ?? [])]
      .sort(
        (a, b) =>
          new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime(),
      )
      .filter(m => {
        const ts = new Date(m.measured_at).getTime();
        if (startMs && ts < startMs) return false;
        if (endMs && ts > endMs) return false;
        return true;
      })
      .map(m => {
        const c1ok = m.bee_counter_1_ok !== false;
        const c2ok = m.bee_counter_2_ok !== false;
        const in1 = c1ok ? toFiniteNumber(m.bee_counter_1_interval_in) : null;
        const out1 = c1ok ? toFiniteNumber(m.bee_counter_1_interval_out) : null;
        const in2 = c2ok ? toFiniteNumber(m.bee_counter_2_interval_in) : null;
        const out2 = c2ok ? toFiniteNumber(m.bee_counter_2_interval_out) : null;
        return {
          timestamp: new Date(m.measured_at).getTime(),
          measuredAt: m.measured_at,
          in1,
          out1,
          net1: in1 !== null && out1 !== null ? in1 - out1 : null,
          in2,
          out2,
          net2: in2 !== null && out2 !== null ? in2 - out2 : null,
        };
      });
  }, [measurements, dateRange]);

  // Cumulative data (running total of interval counts)
  const cumulativeData = useMemo(() => {
    let cumIn1 = 0,
      cumOut1 = 0,
      cumIn2 = 0,
      cumOut2 = 0;
    return chartData.map(row => {
      if (row.in1 !== null) cumIn1 += row.in1;
      if (row.out1 !== null) cumOut1 += row.out1;
      if (row.in2 !== null) cumIn2 += row.in2;
      if (row.out2 !== null) cumOut2 += row.out2;
      return {
        ...row,
        cumIn1,
        cumOut1,
        cumIn2,
        cumOut2,
      };
    });
  }, [chartData]);

  const anyCounterPresent = hasCounter1 || hasCounter2;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-500" />
              <div>
                <CardTitle className="text-base">Entrance Counter</CardTitle>
                <CardDescription>
                  Bees entering and exiting per measurement interval
                </CardDescription>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !anyCounterPresent ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No BeeCounter data found for this device.
              </div>
            ) : (
              <>
                {/* Health + summary cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {hasCounter1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{scale1Name}</span>
                        <HealthBadge
                          ok={health.ch1.ok}
                          gatesHealthy={health.ch1.gatesHealthy}
                          numGates={health.ch1.numGates}
                          glitchCount={health.ch1.glitchCount}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <StatCard
                          label="In (period)"
                          value={totalIn1.toLocaleString()}
                          trend="up"
                        />
                        <StatCard
                          label="Out (period)"
                          value={totalOut1.toLocaleString()}
                          trend="down"
                        />
                        <StatCard
                          label="Net flow"
                          value={(totalIn1 - totalOut1).toLocaleString()}
                          sub={
                            totalIn1 - totalOut1 > 0
                              ? 'net inbound'
                              : totalIn1 - totalOut1 < 0
                                ? 'net outbound'
                                : 'balanced'
                          }
                          trend={
                            totalIn1 - totalOut1 > 0
                              ? 'up'
                              : totalIn1 - totalOut1 < 0
                                ? 'down'
                                : 'neutral'
                          }
                        />
                      </div>
                    </div>
                  )}

                  {hasCounter2 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{scale2Name}</span>
                        <HealthBadge
                          ok={health.ch2.ok}
                          gatesHealthy={health.ch2.gatesHealthy}
                          numGates={health.ch2.numGates}
                          glitchCount={health.ch2.glitchCount}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <StatCard
                          label="In (period)"
                          value={totalIn2.toLocaleString()}
                          trend="up"
                        />
                        <StatCard
                          label="Out (period)"
                          value={totalOut2.toLocaleString()}
                          trend="down"
                        />
                        <StatCard
                          label="Net flow"
                          value={(totalIn2 - totalOut2).toLocaleString()}
                          sub={
                            totalIn2 - totalOut2 > 0
                              ? 'net inbound'
                              : totalIn2 - totalOut2 < 0
                                ? 'net outbound'
                                : 'balanced'
                          }
                          trend={
                            totalIn2 - totalOut2 > 0
                              ? 'up'
                              : totalIn2 - totalOut2 < 0
                                ? 'down'
                                : 'neutral'
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* View selector */}
                <div className="flex gap-1">
                  {(
                    [
                      { key: 'activity', label: 'In / Out' },
                      { key: 'flow', label: 'Net flow' },
                      { key: 'cumulative', label: 'Cumulative' },
                    ] as const
                  ).map(({ key, label }) => (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant={activeView === key ? 'default' : 'outline'}
                      onClick={() => setActiveView(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {/* Charts */}
                {activeView === 'activity' && (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          scale="time"
                          type="number"
                          domain={['dataMin', 'dataMax']}
                          tickFormatter={formatTick}
                          minTickGap={48}
                        />
                        <YAxis unit=" bees" width={64} allowDecimals={false} />
                        <Tooltip
                          labelFormatter={v => formatDateTime(Number(v))}
                        />
                        <Legend />
                        {hasCounter1 && (
                          <>
                            <Bar
                              dataKey="in1"
                              name={`${scale1Name} in`}
                              stackId="ch1"
                              fill="var(--chart-1)"
                              isAnimationActive={false}
                            />
                            <Bar
                              dataKey="out1"
                              name={`${scale1Name} out`}
                              stackId="ch1"
                              fill="var(--chart-2)"
                              isAnimationActive={false}
                            />
                          </>
                        )}
                        {hasCounter2 && (
                          <>
                            <Bar
                              dataKey="in2"
                              name={`${scale2Name} in`}
                              stackId="ch2"
                              fill="var(--chart-3)"
                              isAnimationActive={false}
                            />
                            <Bar
                              dataKey="out2"
                              name={`${scale2Name} out`}
                              stackId="ch2"
                              fill="var(--chart-4)"
                              isAnimationActive={false}
                            />
                          </>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeView === 'flow' && (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          scale="time"
                          type="number"
                          domain={['dataMin', 'dataMax']}
                          tickFormatter={formatTick}
                          minTickGap={48}
                        />
                        <YAxis unit=" bees" width={64} />
                        <ReferenceLine y={0} stroke="var(--border)" />
                        <Tooltip
                          labelFormatter={v => formatDateTime(Number(v))}
                        />
                        <Legend />
                        {hasCounter1 && (
                          <Line
                            type="monotone"
                            dataKey="net1"
                            name={`${scale1Name} net`}
                            stroke="var(--chart-1)"
                            dot={false}
                            connectNulls={false}
                            strokeWidth={1.5}
                            unit=" bees"
                          />
                        )}
                        {hasCounter2 && (
                          <Line
                            type="monotone"
                            dataKey="net2"
                            name={`${scale2Name} net`}
                            stroke="var(--chart-3)"
                            dot={false}
                            connectNulls={false}
                            strokeWidth={1.5}
                            unit=" bees"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeView === 'cumulative' && (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cumulativeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          scale="time"
                          type="number"
                          domain={['dataMin', 'dataMax']}
                          tickFormatter={formatTick}
                          minTickGap={48}
                        />
                        <YAxis unit=" bees" width={72} allowDecimals={false} />
                        <Tooltip
                          labelFormatter={v => formatDateTime(Number(v))}
                        />
                        <Legend />
                        {hasCounter1 && (
                          <>
                            <Line
                              type="monotone"
                              dataKey="cumIn1"
                              name={`${scale1Name} total in`}
                              stroke="var(--chart-1)"
                              dot={false}
                              connectNulls={false}
                              strokeWidth={1.5}
                              unit=" bees"
                            />
                            <Line
                              type="monotone"
                              dataKey="cumOut1"
                              name={`${scale1Name} total out`}
                              stroke="var(--chart-2)"
                              dot={false}
                              connectNulls={false}
                              strokeWidth={1.5}
                              strokeDasharray="4 2"
                              unit=" bees"
                            />
                          </>
                        )}
                        {hasCounter2 && (
                          <>
                            <Line
                              type="monotone"
                              dataKey="cumIn2"
                              name={`${scale2Name} total in`}
                              stroke="var(--chart-3)"
                              dot={false}
                              connectNulls={false}
                              strokeWidth={1.5}
                              unit=" bees"
                            />
                            <Line
                              type="monotone"
                              dataKey="cumOut2"
                              name={`${scale2Name} total out`}
                              stroke="var(--chart-4)"
                              dot={false}
                              connectNulls={false}
                              strokeWidth={1.5}
                              strokeDasharray="4 2"
                              unit=" bees"
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Technical health detail */}
                <details className="group">
                  <summary className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Activity className="h-3.5 w-3.5" />
                    Hardware diagnostics
                    <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2 text-xs">
                    {([1, 2] as const)
                      .filter(ch => (ch === 1 ? hasCounter1 : hasCounter2))
                      .map(ch => {
                        const h = ch === 1 ? health.ch1 : health.ch2;
                        const name = ch === 1 ? scale1Name : scale2Name;
                        return (
                          <div
                            key={ch}
                            className="rounded-md border p-2 space-y-1"
                          >
                            <div className="font-medium">{name}</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                              <span>Gates healthy</span>
                              <span className="text-foreground">
                                {h.gatesHealthy ?? '—'} / {h.numGates ?? '—'}
                              </span>
                              <span>Glitch count</span>
                              <span
                                className={
                                  h.glitchCount && h.glitchCount > 0
                                    ? 'text-amber-500'
                                    : 'text-foreground'
                                }
                              >
                                {h.glitchCount ?? '—'}
                              </span>
                              <span>Total in (lifetime)</span>
                              <span className="text-foreground">
                                {h.latestTotalIn?.toLocaleString() ?? '—'}
                              </span>
                              <span>Total out (lifetime)</span>
                              <span className="text-foreground">
                                {h.latestTotalOut?.toLocaleString() ?? '—'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </details>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
