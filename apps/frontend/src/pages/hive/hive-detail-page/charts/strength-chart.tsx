import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
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
    <ChartCard
      title="Colony Strength"
      description="Occupied frame-space count recorded over time"
    >
      <ChartContainer
        config={{
          strength: { label: 'Strength', color: '#6366f1' },
        }}
      >
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
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
