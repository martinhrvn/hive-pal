import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartPeriod } from './index';
import { useInspectionChartData } from './useChartData';

interface InspectionChartsProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

export const InspectionCharts: React.FC<InspectionChartsProps> = ({
  hiveId,
  period,
}) => {
  const inspectionData = useInspectionChartData(
    hiveId,
    period,
    inspection => ({
      date: format(parseISO(inspection.date), 'MMM dd'),
      overallScore: inspection.score?.overallScore ?? null,
      populationScore: inspection.score?.populationScore ?? null,
      storesScore: inspection.score?.storesScore ?? null,
      queenScore: inspection.score?.queenScore ?? null,
    }),
    inspection => inspection.score != null,
  );

  if (!hiveId || inspectionData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No inspection data available
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Inspection Score Trends</CardTitle>
          <CardDescription>
            Colony health scores over recent inspections (0-10 scale)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              overallScore: {
                label: 'Overall Score',
                color: '#10b981', // Green
              },
              populationScore: {
                label: 'Population',
                color: '#3b82f6', // Blue
              },
              storesScore: {
                label: 'Stores',
                color: '#f59e0b', // Amber
              },
              queenScore: {
                label: 'Queen',
                color: '#a855f7', // Purple
              },
            }}
          >
            <LineChart data={inspectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="overallScore"
                stroke="var(--color-overallScore)"
                strokeWidth={2}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="populationScore"
                stroke="var(--color-populationScore)"
                strokeWidth={2}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="storesScore"
                stroke="var(--color-storesScore)"
                strokeWidth={2}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="queenScore"
                stroke="var(--color-queenScore)"
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Details</CardTitle>
          <CardDescription>
            Individual score components over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              populationScore: {
                label: 'Population',
                color: '#3b82f6', // Blue
              },
              storesScore: {
                label: 'Stores',
                color: '#f59e0b', // Amber
              },
              queenScore: {
                label: 'Queen',
                color: '#a855f7', // Purple
              },
            }}
          >
            <LineChart data={inspectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="populationScore"
                stroke="var(--color-populationScore)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="storesScore"
                stroke="var(--color-storesScore)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="queenScore"
                stroke="var(--color-queenScore)"
                strokeWidth={2}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
};
