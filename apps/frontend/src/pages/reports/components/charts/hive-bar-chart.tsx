import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

type HiveBarDatum<K extends string> = {
  hiveId: string;
  hiveName: string;
} & Record<K, number>;

interface HiveBarChartProps<K extends string> {
  title: string;
  description: string;
  data: HiveBarDatum<K>[] | undefined;
  isLoading: boolean;
  /** Numeric field plotted per hive. */
  dataKey: K;
  /** Series name shown in the tooltip. */
  seriesLabel: string;
  /** Any CSS colour; prefer theme tokens such as `var(--honey)`. */
  color: string;
}

const CHART_CURSOR = { fill: 'var(--muted)', opacity: 0.5 };
const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

/** Card with one bar per hive, used for the per-hive report totals. */
export function HiveBarChart<K extends string>({
  title,
  description,
  data,
  isLoading,
  dataKey,
  seriesLabel,
  color,
}: HiveBarChartProps<K>) {
  const { t } = useTranslation('common');
  const config = {
    [dataKey]: { label: seriesLabel, color },
  } satisfies ChartConfig;

  let body;
  if (isLoading) {
    body = <Skeleton className="h-[300px] w-full" />;
  } else if (!data || data.length === 0) {
    body = (
      <div className="py-8 text-center text-muted-foreground">
        {t('messages.noData')}
      </div>
    );
  } else {
    body = (
      <ChartContainer config={config}>
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
            cursor={CHART_CURSOR}
          />
          <Bar
            dataKey={dataKey}
            fill={`var(--color-${dataKey})`}
            radius={BAR_RADIUS}
          />
        </BarChart>
      </ChartContainer>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
