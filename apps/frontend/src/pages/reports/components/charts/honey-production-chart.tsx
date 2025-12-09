import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

interface HoneyProductionChartProps {
  data: Array<{ hiveId: string; hiveName: string; amount: number }> | undefined;
  isLoading: boolean;
}

export const HoneyProductionChart = ({
  data,
  isLoading,
}: HoneyProductionChartProps) => {
  const { t } = useTranslation('common');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.honeyProduction')}</CardTitle>
          <CardDescription>Total honey harvested per hive (kg)</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.honeyProduction')}</CardTitle>
          <CardDescription>Total honey harvested per hive (kg)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            {t('messages.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.honeyProduction')}</CardTitle>
        <CardDescription>Total honey harvested per hive (kg)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            amount: {
              label: 'Honey (kg)',
              color: '#f59e0b',
            },
          }}
        >
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="hiveName"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
            />
            <Bar
              dataKey="amount"
              fill="var(--color-amount)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
