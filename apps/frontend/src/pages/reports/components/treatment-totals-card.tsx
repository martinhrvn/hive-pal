import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiaryTreatmentTotals } from '@/api/hooks';

interface Props {
  apiaryId?: string;
  period?: string;
}

function periodToFrom(period?: string): string | undefined {
  const now = new Date();
  switch (period) {
    case '1month':
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    case '3months':
      return new Date(now.setMonth(now.getMonth() - 3)).toISOString();
    case '6months':
      return new Date(now.setMonth(now.getMonth() - 6)).toISOString();
    case '1year':
      return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return undefined; // all time
  }
}

function formatMass(mg: number): string {
  if (mg < 1000) return `${Math.round(mg)} mg`;
  const g = mg / 1000;
  return `${g >= 100 ? g.toFixed(0) : g.toFixed(2)} g`;
}

export function TreatmentTotalsCard({ apiaryId, period }: Props) {
  const { t } = useTranslation('common');
  const from = useMemo(() => periodToFrom(period), [period]);
  const { data } = useApiaryTreatmentTotals(apiaryId, { from });

  // Sum each active ingredient across all hives in the apiary.
  const summed = useMemo(() => {
    const map = new Map<string, { name: string; mg: number }>();
    for (const hive of data?.byHive ?? []) {
      for (const it of hive.ingredientTotals) {
        const cur = map.get(it.activeIngredientId) ?? { name: it.name, mg: 0 };
        cur.mg += it.totalMg;
        map.set(it.activeIngredientId, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.mg - a.mg);
  }, [data]);

  const max = summed[0]?.mg ?? 0;

  return (
    <Card data-test="treatment-totals-card">
      <CardHeader>
        <CardTitle>
          {t('reports.treatmentTotals', {
            defaultValue: 'Active ingredients applied (across products)',
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('reports.treatmentTotalsEmpty', {
              defaultValue: 'No treatments recorded for this period.',
            })}
          </p>
        ) : (
          <ul className="space-y-2">
            {summed.map((s) => (
              <li key={s.name}>
                <div className="flex items-center justify-between text-sm mb-0.5">
                  <span>{s.name}</span>
                  <span className="font-medium">{formatMass(s.mg)}</span>
                </div>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${max ? (s.mg / max) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default TreatmentTotalsCard;
