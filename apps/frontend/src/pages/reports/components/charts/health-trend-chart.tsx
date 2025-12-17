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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { TrendData } from 'shared-schemas';
import type { ChartConfig } from '@/components/ui/chart';

interface HealthTrendChartProps {
  data: TrendData['healthTrends'] | undefined;
  isLoading: boolean;
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({
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
    date: format(parseISO(point.date), 'MMM yyyy'),
    overall: point.averageOverall || 0,
    population: point.averagePopulation || 0,
    stores: point.averageStores || 0,
    queen: point.averageQueen || 0,
  }));

  const chartConfig = {
    overall: {
      label: 'Overall',
      color: 'hsl(var(--chart-1))',
    },
    population: {
      label: 'Population',
      color: 'hsl(var(--chart-2))',
    },
    stores: {
      label: 'Stores',
      color: 'hsl(var(--chart-3))',
    },
    queen: {
      label: 'Queen',
      color: 'hsl(var(--chart-4))',
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[0, 10]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="overall"
          stroke="var(--color-overall)"
          fill="var(--color-overall)"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="population"
          stroke="var(--color-population)"
          fill="var(--color-population)"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="stores"
          stroke="var(--color-stores)"
          fill="var(--color-stores)"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="queen"
          stroke="var(--color-queen)"
          fill="var(--color-queen)"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ChartContainer>
  );
};
