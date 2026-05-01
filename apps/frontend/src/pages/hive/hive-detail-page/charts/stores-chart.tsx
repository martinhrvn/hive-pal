import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { ChartCard } from './chart-card';
import { ChartPeriod } from './index';
import { useInspectionChartData } from './useChartData';
import { InspectionResponse } from 'shared-schemas';

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
  const chartData = useInspectionChartData(
    hiveId,
    period,
    inspection => ({
      date: format(parseISO(inspection.date), 'MMM dd'),
      pollen: inspection.observations?.pollenFrames ?? null,
      nectar: inspection.observations?.nectarFrames ?? null,
      honey: inspection.observations?.honeyFrames ?? null,
    }),
    hasStoresData,
  );

  if (!hiveId || chartData.length === 0) return null;

  return (
    <ChartCard
      title="Store Trend"
      description="Pollen, nectar, and honey frame counts over time"
    >
      <ChartContainer
        config={{
          pollen: { label: 'Pollen', color: '#22c55e' },
          nectar: { label: 'Nectar', color: '#f97316' },
          honey:  { label: 'Honey',  color: '#eab308' },
        }}
      >
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line type="monotone" dataKey="pollen" stroke="var(--color-pollen)" strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="nectar" stroke="var(--color-nectar)" strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="honey"  stroke="var(--color-honey)"  strokeWidth={2} connectNulls />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
};
