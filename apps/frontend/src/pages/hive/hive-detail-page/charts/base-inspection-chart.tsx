import React, { ReactNode } from 'react';
import {
  ChartContainer,
} from '@/components/ui/chart';
import { ChartCard } from './chart-card';
import { ChartPeriod } from './index';
import { useInspectionChartData } from './useChartData';
import { InspectionResponse } from 'shared-schemas';

/**
 * Configuration for a chart series (line, bar, etc.)
 */
export interface ChartSeriesConfig {
  label: string;
  color: string;
}

/**
 * Configuration for a chart axis
 */
export interface ChartAxisConfig {
  [key: string]: ChartSeriesConfig;
}

/**
 * Base inspection chart props
 */
export interface BaseInspectionChartProps<T extends { date: string }> {
  hiveId: string | undefined;
  period: ChartPeriod;
  title: string;
  description?: string;
  config: ChartAxisConfig;
  dataTransformer: (inspection: InspectionResponse) => T;
  filterFn?: (inspection: InspectionResponse) => boolean;
  children?: (chartData: T[]) => ReactNode;
}

/**
 * Base component for inspection data visualization charts
 *
 * Provides reusable chart container logic for inspection data,
 * including:
 * - Data fetching with useInspectionChartData
 * - Null checks for missing data
 * - ChartCard wrapper
 * - Configuration management
 */
export const BaseInspectionChart = React.forwardRef<
  HTMLDivElement,
  BaseInspectionChartProps<Record<string, unknown>>
>(
  (
    {
      hiveId,
      period,
      title,
      description,
      config,
      dataTransformer,
      filterFn,
      children,
    },
    ref,
  ) => {
    const chartData = useInspectionChartData(
      hiveId,
      period,
      dataTransformer,
      filterFn,
    );

    if (!hiveId || chartData.length === 0) return null;

    return (
      <div ref={ref}>
        <ChartCard title={title} description={description}>
          <ChartContainer config={config}>
            {children?.(chartData)}
          </ChartContainer>
        </ChartCard>
      </div>
    );
  },
);

BaseInspectionChart.displayName = 'BaseInspectionChart';
