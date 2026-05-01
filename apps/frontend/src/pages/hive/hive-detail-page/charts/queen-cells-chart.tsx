import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
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
  const chartData = useInspectionChartData(
    hiveId,
    period,
    inspection => ({
      date: format(parseISO(inspection.date), 'MMM dd'),
      queenCells: inspection.observations?.queenCells ?? null,
    }),
    hasQueenCellsData,
  );

  if (!hiveId || chartData.length === 0) return null;

  return (
    <ChartCard title="Queen Cells" description="Count of queen cells recorded per inspection">
      <ChartContainer
        config={{
          queenCells: { label: 'Queen Cells', color: '#f43f5e' },
        }}
      >
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
      </ChartContainer>
    </ChartCard>
  );
};
