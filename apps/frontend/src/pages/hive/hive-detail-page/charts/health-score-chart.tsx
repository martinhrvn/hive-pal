import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HiveScore } from 'shared-schemas';
import { useTranslation } from 'react-i18next';

interface HealthScoreChartProps {
  hiveScore: HiveScore | null | undefined;
}

export const HealthScoreChart: React.FC<HealthScoreChartProps> = ({
  hiveScore,
}) => {
  const { t } = useTranslation('hive');
  const scoreData = useMemo(() => {
    if (!hiveScore) return [];

    return [
      {
        metric: t('scores.overall'),
        value: hiveScore.overallScore || 0,
        fullMark: 10,
      },
      {
        metric: t('scores.population'),
        value: hiveScore.populationScore || 0,
        fullMark: 10,
      },
      {
        metric: t('scores.stores'),
        value: hiveScore.storesScore || 0,
        fullMark: 10,
      },
      {
        metric: t('scores.queen'),
        value: hiveScore.queenScore || 0,
        fullMark: 10,
      },
    ];
  }, [hiveScore, t]);

  if (!hiveScore || scoreData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('charts.healthScore.title')}</CardTitle>
        <CardDescription>{t('charts.healthScore.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer
          config={{
            value: {
              label: t('card.score'),
              color: 'var(--chart-1)',
            },
          }}
          className="h-[300px] w-full"
        >
          <RadarChart data={scoreData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 10]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar
              name={t('card.score')}
              dataKey="value"
              stroke="var(--color-value)"
              fill="var(--color-value)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
