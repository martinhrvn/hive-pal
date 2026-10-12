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

// Approximate density used to interpret LEGACY volume records (old syrup
// feedings were stored in ml without a density). v2 records carry amountG.
const LEGACY_SYRUP_DENSITY = 1.23;

/**
 * Total feed mass in kg for one feeding. Prefers the canonical v2 `amountG`;
 * legacy records are converted unit-aware (the old code treated ml as if they
 * were grams, mixing units in the chart).
 */
const feedingAmountKg = (details: {
  amount: number;
  unit: string;
  amountG?: number;
}): number => {
  if (details.amountG != null) return details.amountG / 1000;
  switch (details.unit.toLowerCase()) {
    case 'kg':
      return details.amount;
    case 'g':
      return details.amount / 1000;
    case 'l':
      return (details.amount * 1000 * LEGACY_SYRUP_DENSITY) / 1000;
    case 'ml':
      return (details.amount * LEGACY_SYRUP_DENSITY) / 1000;
    case 'lb':
      return details.amount * 0.453592;
    case 'oz':
      return details.amount * 0.0283495;
    case 'fl oz':
      return (details.amount * 29.5735 * LEGACY_SYRUP_DENSITY) / 1000;
    case 'qt':
      return (details.amount * 946.353 * LEGACY_SYRUP_DENSITY) / 1000;
    case 'gal':
      return (details.amount * 3785.41 * LEGACY_SYRUP_DENSITY) / 1000;
    default:
      return details.amount / 1000;
  }
};

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
          currentAmount += feedingAmountKg(action.details);
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
