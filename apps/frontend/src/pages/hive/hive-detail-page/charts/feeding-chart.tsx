import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, startOfWeek } from 'date-fns';
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
import { ChartPeriod } from './index';
import { useActionChartData } from './useChartData';

interface FeedingChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

export const FeedingChart: React.FC<FeedingChartProps> = ({
  hiveId,
  period,
}) => {
  const feedingData = useActionChartData(
    hiveId,
    period,
    'FEEDING',
    feedingActions => {
      const weeklyFeeding = new Map<
        string,
        { amount: number; startDate: Date }
      >();

      feedingActions.forEach(action => {
        const actionDate = parseISO(action.date);
        const weekStart = startOfWeek(actionDate, { weekStartsOn: 1 }); // Monday as start
        const weekKey = format(weekStart, 'yyyy-MM-dd');

        const current = weeklyFeeding.get(weekKey);
        let currentAmount = current?.amount || 0;

        if (action.details?.type === 'FEEDING' && action.details.amount) {
          const amount =
            action.details.unit === 'kg'
              ? action.details.amount
              : action.details.amount / 1000;
          currentAmount += amount;
        }

        weeklyFeeding.set(weekKey, {
          amount: currentAmount,
          startDate: weekStart,
        });
      });

      return Array.from(weeklyFeeding.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, data]) => ({
          week: format(data.startDate, 'MMM dd'),
          amount: parseFloat(data.amount.toFixed(2)),
        }));
    },
  );

  if (!hiveId || feedingData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feeding History</CardTitle>
        <CardDescription>Weekly feeding amounts in kg</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            amount: {
              label: 'Amount (kg)',
              color: '#f59e0b', // Amber - representing honey/syrup color
            },
          }}
        >
          <BarChart data={feedingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="amount" fill="var(--color-amount)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
