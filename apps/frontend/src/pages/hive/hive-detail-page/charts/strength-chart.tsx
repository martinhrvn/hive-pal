import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ChartCard } from './chart-card';
import { ChartPeriod } from './index';
import { useInspectionChartData } from './useChartData';
import { InspectionResponse } from 'shared-schemas';

interface StrengthChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

function hasStrengthData(inspection: InspectionResponse): boolean {
  return inspection.observations?.strength != null;
}

export const StrengthChart: React.FC<StrengthChartProps> = ({
  hiveId,
  period,
}) => {
  const chartData = useInspectionChartData(
    hiveId,
    period,
    inspection => ({
      date: format(parseISO(inspection.date), 'MMM dd'),
      strength: inspection.observations?.strength ?? null,
    }),
    hasStrengthData,
  );

  if (!hiveId || chartData.length === 0) return null;

  return (
    <ChartCard title="Colony Strength" description="Beekeeper strength rating (0–10) over time">
      <ChartContainer
        config={{
          strength: { label: 'Strength', color: '#6366f1' },
        }}
      >
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ReferenceLine y={5} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="strength"
            stroke="var(--color-strength)"
            strokeWidth={2}
            connectNulls
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
};
