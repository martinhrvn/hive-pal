import { Droplets, Cookie, Heart, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiaryStatistics } from 'shared-schemas';
import { useTranslation } from 'react-i18next';

interface StatisticsCardsProps {
  statistics: ApiaryStatistics | undefined;
  isLoading: boolean;
}

export const StatisticsCards = ({ statistics, isLoading }: StatisticsCardsProps) => {
  const { t } = useTranslation('common');

  const StatCard = ({
    title,
    value,
    unit,
    icon,
    color = 'text-primary',
  }: {
    title: string;
    value: number | null | undefined;
    unit?: string;
    icon: React.ReactNode;
    color?: string;
  }) => (
    <Card className="p-4 sm:p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-sm font-medium text-muted-foreground">
            {title}
          </div>
        </div>
        <div className={`text-2xl sm:text-3xl font-bold ${color}`}>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              {value !== null && value !== undefined ? value.toFixed(1) : '—'}
              {unit && <span className="text-sm font-normal text-muted-foreground"> {unit}</span>}
            </>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title={t('reports.honeyProduction')}
        value={statistics?.honeyProduction.totalAmount}
        unit={statistics?.honeyProduction.unit || 'kg'}
        icon={<Droplets className="h-5 w-5 text-amber-500" />}
        color="text-amber-600"
      />
      <StatCard
        title={t('reports.feedingTotals')}
        value={statistics?.feedingTotals.totalSugarKg}
        unit="kg"
        icon={<Cookie className="h-5 w-5 text-orange-500" />}
        color="text-orange-600"
      />
      <StatCard
        title={t('reports.healthScores')}
        value={statistics?.healthScores.averageOverall}
        unit="/ 10"
        icon={<Heart className="h-5 w-5 text-red-500" />}
        color="text-red-600"
      />
      <StatCard
        title={t('status.active') + ' ' + t('navigation.hives')}
        value={statistics?.summary.activeHives}
        icon={<Home className="h-5 w-5 text-green-500" />}
        color="text-green-600"
      />
    </div>
  );
};
