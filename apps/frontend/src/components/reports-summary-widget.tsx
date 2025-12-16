import { useTranslation } from 'react-i18next';
import { BarChart, Droplet, TrendingUp, PieChart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewDetailsLink } from '@/components/ui/view-details-link';
import { useApiaryStore } from '@/hooks/use-apiary';
import { useApiaryStatistics } from '@/api/hooks/useReports';

export const ReportsSummaryWidget = () => {
  const { t } = useTranslation(['common']);
  const { activeApiaryId } = useApiaryStore();
  const { data: statistics, isLoading } = useApiaryStatistics(activeApiaryId ?? undefined, 'ytd');

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!activeApiaryId) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            {t('reports.widget.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t('reports.widget.noApiary')}
          </div>
        </CardContent>
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {t('reports.widget.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
      <CardFooter className="mt-auto">
        <ViewDetailsLink to="/reports">
          {t('reports.widget.viewReports')}
        </ViewDetailsLink>
      </CardFooter>
    </Card>
  );
};
