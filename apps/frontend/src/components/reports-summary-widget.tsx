import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BarChart, Droplet, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiaryStore } from '@/hooks/use-apiary';
import { useApiaryStatistics } from '@/api/hooks/useReports';

export const ReportsSummaryWidget = () => {
  const { t } = useTranslation(['common']);
  const { activeApiaryId } = useApiaryStore();
  const { data: statistics, isLoading } = useApiaryStatistics(activeApiaryId ?? undefined, 'ytd');

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </Card>
    );
  }

  if (!activeApiaryId) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-sm text-muted-foreground">
          {t('reports.widget.noApiary')}
        </div>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  const getScoreColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'text-muted-foreground';
    if (value >= 6) return 'text-green-600';
    if (value >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('reports.widget.title')}
          </h3>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Honey Production */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">
                {t('reports.honeyProduction')}
              </span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(statistics.honeyProduction.totalAmount)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {statistics.honeyProduction.unit}
              </span>
            </div>
          </div>

          {/* Average Health Score */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">
                {t('reports.healthScores')}
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${getScoreColor(statistics.healthScores.averageOverall)}`}
            >
              {statistics.healthScores.averageOverall
                ? formatNumber(statistics.healthScores.averageOverall)
                : '—'}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / 10
              </span>
            </div>
          </div>

          {/* Feeding Totals */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">
                {t('reports.feedingTotals')}
              </span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(statistics.feedingTotals.totalSugarKg)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                kg
              </span>
            </div>
          </div>
        </div>

        {/* View Reports Link */}
        <div className="pt-2">
          <Link
            to="/reports"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            {t('reports.widget.viewReports')}
          </Link>
        </div>
      </div>
    </Card>
  );
};
