import { useMemo } from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { subMonths, startOfYear, parseISO, format } from 'date-fns';
import { useTranslation } from 'react-i18next';
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
import { useInspections, useHive } from '@/api/hooks';
import { useUnitFormat } from '@/hooks/use-unit-format';
import type { MeasurementSide } from 'shared-schemas';

function getStartDate(period: ChartPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case '1month':
      return subMonths(now, 1);
    case '3months':
      return subMonths(now, 3);
    case '6months':
      return subMonths(now, 6);
    case 'ytd':
      return startOfYear(now);
    default:
      return null;
  }
}

const PALETTE = [
  '#f59e0b',
  '#0ea5e9',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#6366f1',
];

interface WeightChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

export const WeightChart: React.FC<WeightChartProps> = ({ hiveId, period }) => {
  const { t } = useTranslation('inspection');
  const { data: inspections } = useInspections(hiveId ? { hiveId } : undefined);
  const { data: hive } = useHive(hiveId ?? '', { enabled: !!hiveId });
  const { formatWeight, getWeightUnit } = useUnitFormat();
  const unit = getWeightUnit();

  const { rows, series } = useMemo(() => {
    const start = getStartDate(period);
    const boxById = new Map(
      (hive?.boxes ?? [])
        .filter(b => typeof b.id === 'string')
        .map(b => [b.id as string, b] as const),
    );

    const sideLabel = (s: MeasurementSide | null) =>
      s ? t(`form.weights.sides.${s}`) : t('form.weights.wholeWeight');
    const posLabel = (boxId: string | null) => {
      const box = boxId ? boxById.get(boxId) : undefined;
      if (!box) return t('form.weights.wholeHive');
      return t('form.weights.boxLabel', {
        position: box.position + 1,
        type: t(`form.weights.boxType.${box.type}`, box.type),
      });
    };

    // Stable synthetic series keys (series_0, …) keep the chart's CSS vars
    // simple regardless of box UUIDs.
    const seriesByComposite = new Map<
      string,
      { key: string; label: string; color: string }
    >();
    const rowByDate = new Map<string, Record<string, number | string>>();

    (inspections ?? []).forEach(insp => {
      const d = parseISO(insp.date);
      if (start && d < start) return;
      (insp.weights ?? []).forEach(w => {
        const composite = `${w.boxId ?? 'base'}__${w.side ?? 'whole'}`;
        let s = seriesByComposite.get(composite);
        if (!s) {
          const idx = seriesByComposite.size;
          s = {
            key: `series_${idx}`,
            label: `${posLabel(w.boxId)} · ${sideLabel(w.side)}`,
            color: PALETTE[idx % PALETTE.length],
          };
          seriesByComposite.set(composite, s);
        }
        const dateKey = format(d, 'yyyy-MM-dd');
        const row = rowByDate.get(dateKey) ?? { date: format(d, 'MMM dd') };
        row[s.key] = formatWeight(w.value).value;
        rowByDate.set(dateKey, row);
      });
    });

    const rows = Array.from(rowByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, row]) => row);
    const series = Array.from(seriesByComposite.values());
    return { rows, series };
  }, [inspections, hive, period, t, formatWeight]);

  if (!hiveId || rows.length === 0) return null;

  const config = Object.fromEntries(
    series.map(s => [s.key, { label: s.label, color: s.color }]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('form.weights.chartTitle')}</CardTitle>
        <CardDescription>
          {t('form.weights.chartDescription', { unit })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {series.map(s => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={`var(--color-${s.key})`}
                connectNulls
                dot
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
