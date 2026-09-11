import { useTranslation } from 'react-i18next';
import { FlaskConical, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHiveTreatmentSummary } from '@/api/hooks';

interface Props {
  hiveId: string;
  variant?: 'inline' | 'full';
}

/** Human-readable mass: mg below 1 g, otherwise g with up to 2 decimals. */
function formatMass(mg: number): string {
  if (mg < 1000) return `${Math.round(mg)} mg`;
  const g = mg / 1000;
  return `${g >= 100 ? g.toFixed(0) : g.toFixed(2)} g`;
}

export function TreatmentSummary({ hiveId }: Props) {
  const { t } = useTranslation('hive');
  const { data, isLoading } = useHiveTreatmentSummary(hiveId);

  const totals = data?.ingredientTotals ?? [];
  const withdrawal = data?.withdrawal;

  return (
    <Card data-test="treatment-summary-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          {t('treatmentSummary.title', {
            defaultValue: 'Applied active ingredients',
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Withdrawal status */}
        {withdrawal && (
          <div>
            {withdrawal.inWithdrawal ? (
              <Badge
                variant="destructive"
                className="gap-1"
                data-test="withdrawal-active"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                {t('treatmentSummary.inWithdrawal', {
                  defaultValue: 'In withdrawal until {{date}} ({{product}})',
                  date: withdrawal.until
                    ? new Date(withdrawal.until).toLocaleDateString()
                    : '',
                  product: withdrawal.product?.name ?? '',
                })}
              </Badge>
            ) : withdrawal.product ? (
              <Badge variant="secondary" className="gap-1" data-test="withdrawal-clear">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('treatmentSummary.safeToHarvest', {
                  defaultValue: 'Withdrawal passed — safe to harvest',
                })}
              </Badge>
            ) : null}
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {!isLoading && totals.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('treatmentSummary.empty', {
              defaultValue: 'No treatments with a known composition yet.',
            })}
          </p>
        )}

        {totals.length > 0 && (
          <ul className="divide-y" data-test="ingredient-totals">
            {totals.map((it) => (
              <li
                key={it.activeIngredientId}
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <span>{it.name}</span>
                <span className="flex items-center gap-2 font-medium">
                  {formatMass(it.totalMg)}
                  {it.incompleteCount > 0 && (
                    <span
                      title={t('treatmentSummary.incompleteHint', {
                        defaultValue:
                          '{{n}} treatment(s) could not be converted (missing density / incompatible units)',
                        n: it.incompleteCount,
                      })}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default TreatmentSummary;
