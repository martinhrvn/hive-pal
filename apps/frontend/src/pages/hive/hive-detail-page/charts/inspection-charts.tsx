import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
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
import { useTranslation } from 'react-i18next';

interface InspectionChartsProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

export const InspectionCharts: React.FC<InspectionChartsProps> = ({
  hiveId,
  period,
}) => {
  const { t } = useTranslation('hive');
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
        {t('charts.noInspectionData')}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.scoreTrends.title')}</CardTitle>
          <CardDescription>
            {t('charts.scoreTrends.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              overallScore: {
                label: t('scores.overallScore'),
                color: '#10b981', // Green
              },
              populationScore: {
                label: t('scores.population'),
                color: '#3b82f6', // Blue
              },
              storesScore: {
                label: t('scores.stores'),
                color: '#f59e0b', // Amber
              },
              queenScore: {
                label: t('scores.queen'),
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
          <CardTitle>{t('charts.scoreDetails.title')}</CardTitle>
          <CardDescription>
            {t('charts.scoreDetails.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              populationScore: {
                label: t('scores.population'),
                color: '#3b82f6', // Blue
              },
              storesScore: {
                label: t('scores.stores'),
                color: '#f59e0b', // Amber
              },
              queenScore: {
                label: t('scores.queen'),
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
