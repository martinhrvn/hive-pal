import { format, parseISO } from 'date-fns';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
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
import { useTranslation } from 'react-i18next';

interface BroodPatternChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

const PATTERN_ROWS = [
  { key: 'excellent', y: 6, color: 'var(--chart-1)' },
  { key: 'solid', y: 5, color: 'var(--chart-5)' },
  { key: 'patchy', y: 4, color: 'var(--chart-7)' },
  { key: 'spotty', y: 3, color: 'var(--chart-2)' },
  { key: 'scattered', y: 2, color: 'var(--chart-6)' },
  { key: 'poor', y: 1, color: 'var(--chart-8)' },
] as const;

type PatternKey = (typeof PATTERN_ROWS)[number]['key'];

function hasBroodPatternData(inspection: InspectionResponse): boolean {
  return inspection.observations?.broodPattern != null;
}

export const BroodPatternChart: React.FC<BroodPatternChartProps> = ({
  hiveId,
  period,
}) => {
  const { t } = useTranslation(['hive', 'inspection']);
  const patternLabel = (key: PatternKey) =>
    t(`inspection:observations.broodPatternOptions.${key}`);
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
      return row
        ? {
            date: d.date as string,
            y: row.y,
            color: row.color,
            label: patternLabel(row.key),
          }
        : null;
    })
    .filter(Boolean) as {
    date: string;
    y: number;
    color: string;
    label: string;
  }[];

  if (points.length === 0) return null;

  const yTicks = PATTERN_ROWS.map(r => r.y);
  const yTickFormatter = (v: number) => {
    const row = PATTERN_ROWS.find(r => r.y === v);
    return row ? patternLabel(row.key) : '';
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('inspection:observations.broodPattern')}</CardTitle>
        <CardDescription>
          {t('hive:charts.broodPattern.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            pattern: {
              label: t('inspection:observations.broodPattern'),
              color: 'var(--chart-1)',
            },
          }}
        >
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              type="category"
              allowDuplicatedCategory={false}
            />
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
