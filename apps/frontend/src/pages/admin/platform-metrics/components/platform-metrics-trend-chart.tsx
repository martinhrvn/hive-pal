import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PlatformMetricsSnapshot } from 'shared-schemas';
import type { ChartConfig } from '@/components/ui/chart';

type MetricType = 'entities' | 'activity';

const METRIC_OPTIONS: { value: MetricType; label: string }[] = [
  { value: 'entities', label: 'Entity Counts' },
  { value: 'activity', label: 'Active Users' },
];

interface PlatformMetricsTrendChartProps {
  data: PlatformMetricsSnapshot[] | undefined;
  isLoading: boolean;
}

export const PlatformMetricsTrendChart: React.FC<
  PlatformMetricsTrendChartProps
> = ({ data, isLoading }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('entities');

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
        No metrics data available yet. Data will appear after the first daily
        snapshot.
      </div>
    );
  }

  // Transform data for the chart
  const chartData = data.map((snapshot) => ({
    date: format(parseISO(snapshot.date), 'MMM dd'),
    totalUsers: snapshot.totalUsers,
    totalApiaries: snapshot.totalApiaries,
    totalHives: snapshot.totalHives,
    totalInspections: snapshot.totalInspections,
    activeUsers7Days: snapshot.activeUsers7Days,
    activeUsers30Days: snapshot.activeUsers30Days,
  }));

  // Get config based on selected metric
  const getChartConfig = (): ChartConfig => {
    switch (selectedMetric) {
      case 'entities':
        return {
          totalUsers: {
            label: 'Users',
            color: 'hsl(var(--chart-1))',
          },
          totalApiaries: {
            label: 'Apiaries',
            color: 'hsl(var(--chart-2))',
          },
          totalHives: {
            label: 'Hives',
            color: 'hsl(var(--chart-3))',
          },
          totalInspections: {
            label: 'Inspections',
            color: 'hsl(var(--chart-4))',
          },
        };
      case 'activity':
        return {
          activeUsers7Days: {
            label: 'Active (7 days)',
            color: 'hsl(var(--chart-1))',
          },
          activeUsers30Days: {
            label: 'Active (30 days)',
            color: 'hsl(var(--chart-2))',
          },
        };
      default:
        return {};
    }
  };

  const chartConfig = getChartConfig();

  // Get lines to render based on selected metric
  const renderLines = () => {
    switch (selectedMetric) {
      case 'entities':
        return (
          <>
            <Line
              type="monotone"
              dataKey="totalUsers"
              stroke="var(--color-totalUsers)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="totalApiaries"
              stroke="var(--color-totalApiaries)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="totalHives"
              stroke="var(--color-totalHives)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="totalInspections"
              stroke="var(--color-totalInspections)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </>
        );
      case 'activity':
        return (
          <>
            <Line
              type="monotone"
              dataKey="activeUsers7Days"
              stroke="var(--color-activeUsers7Days)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="activeUsers30Days"
              stroke="var(--color-activeUsers30Days)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">View:</span>
        <Select
          value={selectedMetric}
          onValueChange={(v) => setSelectedMetric(v as MetricType)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRIC_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {renderLines()}
        </LineChart>
      </ChartContainer>
    </div>
  );
};
