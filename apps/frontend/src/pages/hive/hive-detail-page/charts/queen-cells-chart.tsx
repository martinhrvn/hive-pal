import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BaseInspectionChart } from './base-inspection-chart';
import { ChartPeriod } from './index';
import { InspectionResponse } from 'shared-schemas';
import { useTranslation } from 'react-i18next';

interface QueenCellsChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

function hasQueenCellsData(inspection: InspectionResponse): boolean {
  return inspection.observations?.queenCells != null;
}

export const QueenCellsChart: React.FC<QueenCellsChartProps> = ({
  hiveId,
  period,
}) => {
  const { t } = useTranslation(['hive', 'inspection']);
  return (
    <BaseInspectionChart
      hiveId={hiveId}
      period={period}
      title={t('inspection:observations.queenCells')}
      description={t('hive:charts.queenCells.description')}
      config={{
        queenCells: {
          label: t('inspection:observations.queenCells'),
          color: 'var(--chart-6)',
        },
      }}
      dataTransformer={inspection => ({
        date: format(parseISO(inspection.date), 'MMM dd'),
        queenCells: inspection.observations?.queenCells ?? null,
      })}
      filterFn={hasQueenCellsData}
    >
      {chartData => (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="queenCells"
            fill="var(--color-queenCells)"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      )}
    </BaseInspectionChart>
  );
};
