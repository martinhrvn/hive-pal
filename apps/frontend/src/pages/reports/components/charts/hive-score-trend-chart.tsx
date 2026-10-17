import { useState } from 'react';
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
import type { TrendData } from 'shared-schemas';
import type { ChartConfig } from '@/components/ui/chart';
import { useTranslation } from 'react-i18next';

type ScoreType =
  'overallScore' | 'populationScore' | 'storesScore' | 'queenScore';

interface HiveScoreTrendChartProps {
  data: TrendData['hiveHealthTrends'] | undefined;
  isLoading: boolean;
}

const SCORE_OPTIONS: { value: ScoreType; labelKey: string }[] = [
  { value: 'overallScore', labelKey: 'reports.table.overall' },
  { value: 'populationScore', labelKey: 'reports.table.population' },
  { value: 'storesScore', labelKey: 'reports.table.stores' },
  { value: 'queenScore', labelKey: 'reports.table.queen' },
];

// Chart colors for different hives
const HIVE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'hsl(210, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(30, 70%, 50%)',
  'hsl(160, 70%, 50%)',
  'hsl(340, 70%, 50%)',
];

export const HiveScoreTrendChart: React.FC<HiveScoreTrendChartProps> = ({
  data,
  isLoading,
}) => {
  const { t } = useTranslation('common');
  const [selectedScore, setSelectedScore] = useState<ScoreType>('overallScore');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        {t('status.loading')}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        {t('messages.noData')}
      </div>
    );
  }

  // Filter hives that have data points
  const hivesWithData = data.filter(hive => hive.dataPoints.length > 0);

  if (hivesWithData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        {t('reports.charts.noInspectionData')}
      </div>
    );
  }

  // Get all unique dates across all hives
  const allDates = new Set<string>();
  hivesWithData.forEach(hive => {
    hive.dataPoints.forEach(point => {
      allDates.add(format(parseISO(point.date), 'yyyy-MM'));
    });
  });

  // Sort dates
  const sortedDates = Array.from(allDates).sort(
    (a, b) => new Date(a + '-01').getTime() - new Date(b + '-01').getTime(),
  );

  // Transform data for the chart - one row per date, with each hive as a column
  const chartData = sortedDates.map(dateKey => {
    const row: Record<string, string | number | null> = {
      date: format(new Date(dateKey + '-01'), 'MMM yyyy'),
    };

    hivesWithData.forEach(hive => {
      const dataPoint = hive.dataPoints.find(
        point => format(parseISO(point.date), 'yyyy-MM') === dateKey,
      );
      row[hive.hiveId] = dataPoint ? dataPoint[selectedScore] : null;
    });

    return row;
  });

  // Create chart config for each hive
  const chartConfig = hivesWithData.reduce((config, hive, index) => {
    config[hive.hiveId] = {
      label: hive.hiveName,
      color: HIVE_COLORS[index % HIVE_COLORS.length],
    };
    return config;
  }, {} as ChartConfig);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {t('reports.charts.scoreType')}
        </span>
        <Select
          value={selectedScore}
          onValueChange={v => setSelectedScore(v as ScoreType)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCORE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChartContainer config={chartConfig}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
          <YAxis domain={[0, 10]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {hivesWithData.map((hive, index) => (
            <Line
              key={hive.hiveId}
              type="monotone"
              dataKey={hive.hiveId}
              name={hive.hiveName}
              stroke={HIVE_COLORS[index % HIVE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
};
