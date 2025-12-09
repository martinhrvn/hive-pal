import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { TrendData } from 'shared-schemas';
import type { ChartConfig } from '@/components/ui/chart';

interface FeedingTrendChartProps {
  data: TrendData['feedingTrends'] | undefined;
  isLoading: boolean;
}

export const FeedingTrendChart: React.FC<FeedingTrendChartProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  // Transform data for the chart
  const chartData = data.map(point => ({
    week: format(parseISO(point.weekStart), 'MMM dd'),
    sugar: parseFloat(point.sugarKg.toFixed(2)),
  }));

  const chartConfig = {
    sugar: {
      label: 'Sugar (kg)',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="week"
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="sugar"
          stroke="var(--color-sugar)"
          fill="var(--color-sugar)"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ChartContainer>
  );
};
