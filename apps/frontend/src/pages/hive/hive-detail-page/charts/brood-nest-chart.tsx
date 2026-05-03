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
  return (
    <BaseInspectionChart
      hiveId={hiveId}
      period={period}
      title="Brood Nest Trend"
      description="Frame counts over time"
      config={{
        eggs:    { label: 'Eggs',           color: '#facc15' },
        uncapped:{ label: 'Uncapped Brood', color: '#fb923c' },
        capped:  { label: 'Capped Brood',   color: '#b45309' },
        drone:   { label: 'Drone Brood',    color: '#92400e' },
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
      {(chartData) => (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line type="monotone" dataKey="eggs"     stroke="var(--color-eggs)"     strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="uncapped" stroke="var(--color-uncapped)" strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="capped"   stroke="var(--color-capped)"   strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="drone"    stroke="var(--color-drone)"    strokeWidth={2} connectNulls />
        </LineChart>
      )}
    </BaseInspectionChart>
  );
};
