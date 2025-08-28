import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartPeriod } from './index';
import { useActionChartData } from './useChartData';

interface TreatmentChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

export const TreatmentChart: React.FC<TreatmentChartProps> = ({ hiveId, period }) => {
  const treatmentData = useActionChartData(
    hiveId,
    period,
    'TREATMENT',
    (treatmentActions) => {
      const treatmentCounts = new Map<string, Map<string, number>>();

      treatmentActions.forEach(action => {
        const month = format(parseISO(action.date), 'MMM yyyy');
        
        if (action.details?.type === 'TREATMENT' && action.details.product) {
          const product = action.details.product;
          
          if (!treatmentCounts.has(month)) {
            treatmentCounts.set(month, new Map());
          }
          
          const monthMap = treatmentCounts.get(month)!;
          monthMap.set(product, (monthMap.get(product) || 0) + 1);
        }
      });

      const products = new Set<string>();
      treatmentCounts.forEach(monthMap => {
        monthMap.forEach((_, product) => products.add(product));
      });

      return Array.from(treatmentCounts.entries())
        .map(([month, productMap]) => {
          const data: any = { month };
          products.forEach(product => {
            data[product] = productMap.get(product) || 0;
          });
          return data;
        });
    }
  );

  if (!hiveId || treatmentData.length === 0) {
    return null;
  }

  const products = [...new Set(treatmentData.flatMap(d => Object.keys(d).filter(k => k !== 'month')))];
  
  const treatmentColors = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#84cc16', // Lime
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#14b8a6', // Teal
  ];
  
  const config = Object.fromEntries(
    products.map((product, index) => [
      product,
      {
        label: product,
        color: treatmentColors[index % treatmentColors.length],
      },
    ])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment History</CardTitle>
        <CardDescription>
          Monthly treatment applications by product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={treatmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {products.map((product) => (
              <Bar
                key={product}
                dataKey={product}
                fill={`var(--color-${product})`}
                stackId="a"
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};