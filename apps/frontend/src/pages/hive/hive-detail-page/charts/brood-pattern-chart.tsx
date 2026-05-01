import { format, parseISO } from 'date-fns';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartPeriod } from './index';
import { useInspectionChartData } from './useChartData';
import { InspectionResponse } from 'shared-schemas';

interface BroodPatternChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

const PATTERN_ROWS = [
  { key: 'excellent', label: 'Excellent', y: 6, color: '#10b981' },
  { key: 'solid',     label: 'Solid',     y: 5, color: '#22c55e' },
  { key: 'patchy',    label: 'Patchy',    y: 4, color: '#eab308' },
  { key: 'spotty',    label: 'Spotty',    y: 3, color: '#f97316' },
  { key: 'scattered', label: 'Scattered', y: 2, color: '#ef4444' },
  { key: 'poor',      label: 'Poor',      y: 1, color: '#991b1b' },
] as const;

type PatternKey = (typeof PATTERN_ROWS)[number]['key'];

function hasBroodPatternData(inspection: InspectionResponse): boolean {
  return inspection.observations?.broodPattern != null;
}

export const BroodPatternChart: React.FC<BroodPatternChartProps> = ({
  hiveId,
  period,
}) => {
  const chartData = useInspectionChartData(
    hiveId,
    period,
    inspection => ({
      date: format(parseISO(inspection.date), 'MMM dd'),
      pattern: inspection.observations?.broodPattern ?? null,
    }),
    hasBroodPatternData,
  );

  if (!hiveId || chartData.length === 0) return null;

  // Map each data point to { date, y, color }
  const points = chartData
    .filter(d => d.pattern != null)
    .map(d => {
      const row = PATTERN_ROWS.find(r => r.key === (d.pattern as PatternKey));
      return row ? { date: d.date as string, y: row.y, color: row.color, label: row.label } : null;
    })
    .filter(Boolean) as { date: string; y: number; color: string; label: string }[];

  if (points.length === 0) return null;

  const yTicks = PATTERN_ROWS.map(r => r.y);
  const yTickFormatter = (v: number) =>
    PATTERN_ROWS.find(r => r.y === v)?.label ?? '';

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Brood Pattern</CardTitle>
        <CardDescription>
          Recorded brood pattern quality per inspection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ pattern: { label: 'Brood Pattern', color: '#6366f1' } }}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
            <YAxis
              dataKey="y"
              type="number"
              domain={[0, 7]}
              ticks={yTicks}
              tickFormatter={yTickFormatter}
              width={80}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(_, __, props) => props.payload?.label ?? ''}
                />
              }
            />
            <Scatter data={points} name="pattern">
              {points.map(pt => (
                <Cell key={`${pt.date}-${pt.y}`} fill={pt.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
