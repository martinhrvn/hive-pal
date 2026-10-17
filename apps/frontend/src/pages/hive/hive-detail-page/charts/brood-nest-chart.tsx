import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BaseInspectionChart } from './base-inspection-chart';
import { ChartPeriod } from './index';
import { InspectionResponse } from 'shared-schemas';
import { useTranslation } from 'react-i18next';

interface BroodNestChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

function hasBroodData(inspection: InspectionResponse): boolean {
  const obs = inspection.observations;
  return (
    obs != null &&
    (obs.eggsFrames != null ||
      obs.uncappedBroodFrames != null ||
      obs.cappedBroodFrames != null ||
      obs.droneBroodFrames != null)
  );
}

export const BroodNestChart: React.FC<BroodNestChartProps> = ({
  hiveId,
  period,
}) => {
  const { t } = useTranslation(['hive', 'inspection']);
  return (
    <BaseInspectionChart
      hiveId={hiveId}
      period={period}
      title={t('hive:charts.broodNest.title')}
      description={t('hive:charts.broodNest.description')}
      config={{
        eggs: {
          label: t('inspection:observations.eggsFrames'),
          color: '#facc15',
        },
        uncapped: {
          label: t('inspection:observations.uncappedBroodFrames'),
          color: '#fb923c',
        },
        capped: {
          label: t('inspection:observations.cappedBroodFrames'),
          color: '#b45309',
        },
        drone: {
          label: t('inspection:observations.droneBroodFrames'),
          color: '#92400e',
        },
      }}
      dataTransformer={inspection => ({
        date: format(parseISO(inspection.date), 'MMM dd'),
        eggs: inspection.observations?.eggsFrames ?? null,
        uncapped: inspection.observations?.uncappedBroodFrames ?? null,
        capped: inspection.observations?.cappedBroodFrames ?? null,
        drone: inspection.observations?.droneBroodFrames ?? null,
      })}
      filterFn={hasBroodData}
    >
      {chartData => (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="eggs"
            stroke="var(--color-eggs)"
            strokeWidth={2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="uncapped"
            stroke="var(--color-uncapped)"
            strokeWidth={2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="capped"
            stroke="var(--color-capped)"
            strokeWidth={2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="drone"
            stroke="var(--color-drone)"
            strokeWidth={2}
            connectNulls
          />
        </LineChart>
      )}
    </BaseInspectionChart>
  );
};
