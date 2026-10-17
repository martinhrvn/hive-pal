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
import { useTranslation } from 'react-i18next';

type MetricType = 'entities' | 'activity' | 'weather';

const METRIC_OPTIONS: MetricType[] = ['entities', 'activity', 'weather'];

interface PlatformMetricsTrendChartProps {
  data: PlatformMetricsSnapshot[] | undefined;
  isLoading: boolean;
}

export const PlatformMetricsTrendChart: React.FC<
  PlatformMetricsTrendChartProps
> = ({ data, isLoading }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('entities');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        {t('common:status.loading')}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        {t('platformMetrics.chart.noData')}
      </div>
    );
  }

  // Transform data for the chart
  const chartData = data.map(snapshot => ({
    date: format(parseISO(snapshot.date), 'MMM dd'),
    totalUsers: snapshot.totalUsers,
    totalApiaries: snapshot.totalApiaries,
    totalHives: snapshot.totalHives,
    totalInspections: snapshot.totalInspections,
    activeUsers7Days: snapshot.activeUsers7Days,
    activeUsers30Days: snapshot.activeUsers30Days,
    weatherFetches24h: snapshot.weatherFetches24h ?? 0,
    weatherFetchErrors24h: snapshot.weatherFetchErrors24h ?? 0,
  }));

  // Get config based on selected metric
  const getChartConfig = (): ChartConfig => {
    switch (selectedMetric) {
      case 'entities':
        return {
          totalUsers: {
            label: t('platformMetrics.chart.series.users'),
            color: '#3b82f6', // Blue
          },
          totalApiaries: {
            label: t('platformMetrics.chart.series.apiaries'),
            color: '#10b981', // Green
          },
          totalHives: {
            label: t('platformMetrics.chart.series.hives'),
            color: '#f59e0b', // Amber
          },
          totalInspections: {
            label: t('platformMetrics.chart.series.inspections'),
            color: '#a855f7', // Purple
          },
        };
      case 'activity':
        return {
          activeUsers7Days: {
            label: t('platformMetrics.chart.series.active7Days'),
            color: '#3b82f6', // Blue
          },
          activeUsers30Days: {
            label: t('platformMetrics.chart.series.active30Days'),
            color: '#10b981', // Green
          },
        };
      case 'weather':
        return {
          weatherFetches24h: {
            label: t('platformMetrics.chart.series.weatherFetches'),
            color: '#3b82f6', // Blue
          },
          weatherFetchErrors24h: {
            label: t('platformMetrics.chart.series.errors'),
            color: '#ef4444', // Red
          },
        };
      default:
        return {};
    }
  };

  const chartConfig = getChartConfig();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {t('platformMetrics.chart.view')}
        </span>
        <Select
          value={selectedMetric}
          onValueChange={v => setSelectedMetric(v as MetricType)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRIC_OPTIONS.map(option => (
              <SelectItem key={option} value={option}>
                {t(`platformMetrics.chart.metrics.${option}`)}
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
          {selectedMetric === 'entities' && (
            <Line
              type="monotone"
              dataKey="totalUsers"
              stroke="var(--color-totalUsers)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
          {selectedMetric === 'entities' && (
            <Line
              type="monotone"
              dataKey="totalApiaries"
              stroke="var(--color-totalApiaries)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
          {selectedMetric === 'entities' && (
            <Line
              type="monotone"
              dataKey="totalHives"
              stroke="var(--color-totalHives)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
          {selectedMetric === 'entities' && (
            <Line
              type="monotone"
              dataKey="totalInspections"
              stroke="var(--color-totalInspections)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
          {selectedMetric === 'activity' && (
            <Line
              type="monotone"
              dataKey="activeUsers7Days"
              stroke="var(--color-activeUsers7Days)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
          {selectedMetric === 'activity' && (
            <Line
              type="monotone"
              dataKey="activeUsers30Days"
              stroke="var(--color-activeUsers30Days)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
          {selectedMetric === 'weather' && (
            <Line
              type="monotone"
              dataKey="weatherFetches24h"
              stroke="var(--color-weatherFetches24h)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
          {selectedMetric === 'weather' && (
            <Line
              type="monotone"
              dataKey="weatherFetchErrors24h"
              stroke="var(--color-weatherFetchErrors24h)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
        </LineChart>
      </ChartContainer>
    </div>
  );
};
