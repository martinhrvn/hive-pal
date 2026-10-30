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

interface StoresChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

function hasStoresData(inspection: InspectionResponse): boolean {
  const obs = inspection.observations;
  return (
    obs != null &&
    (obs.pollenFrames != null ||
      obs.nectarFrames != null ||
      obs.honeyFrames != null)
  );
}

export const StoresChart: React.FC<StoresChartProps> = ({ hiveId, period }) => {
  const { t } = useTranslation(['hive', 'inspection']);
  return (
    <BaseInspectionChart
      hiveId={hiveId}
      period={period}
      title={t('hive:charts.stores.title')}
      description={t('hive:charts.stores.description')}
      config={{
        pollen: {
          label: t('inspection:observations.pollenFrames'),
          color: 'var(--chart-3)',
        },
        nectar: {
          label: t('inspection:observations.nectarFrames'),
          color: 'var(--chart-5)',
        },
        honey: {
          label: t('inspection:observations.honeyFrames'),
          color: 'var(--chart-2)',
        },
      }}
      dataTransformer={inspection => ({
        date: format(parseISO(inspection.date), 'MMM dd'),
        pollen: inspection.observations?.pollenFrames ?? null,
        nectar: inspection.observations?.nectarFrames ?? null,
        honey: inspection.observations?.honeyFrames ?? null,
      })}
      filterFn={hasStoresData}
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
            dataKey="pollen"
            stroke="var(--color-pollen)"
            strokeWidth={2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="nectar"
            stroke="var(--color-nectar)"
            strokeWidth={2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="honey"
            stroke="var(--color-honey)"
            strokeWidth={2}
            connectNulls
          />
        </LineChart>
      )}
    </BaseInspectionChart>
  );
};
