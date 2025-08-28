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

interface HealthScoreChartProps {
  hiveScore: HiveScore | null | undefined;
}

export const HealthScoreChart: React.FC<HealthScoreChartProps> = ({
  hiveScore,
}) => {
  const scoreData = useMemo(() => {
    if (!hiveScore) return [];

    return [
      { metric: 'Overall', value: hiveScore.overallScore || 0, fullMark: 10 },
      {
        metric: 'Population',
        value: hiveScore.populationScore || 0,
        fullMark: 10,
      },
      { metric: 'Stores', value: hiveScore.storesScore || 0, fullMark: 10 },
      { metric: 'Queen', value: hiveScore.queenScore || 0, fullMark: 10 },
    ];
  }, [hiveScore]);

  if (!hiveScore || scoreData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hive Health Score</CardTitle>
        <CardDescription>Current health metrics (0-10 scale)</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer
          config={{
            value: {
              label: 'Score',
              color: '#10b981', // Green for health
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
              name="Score"
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
