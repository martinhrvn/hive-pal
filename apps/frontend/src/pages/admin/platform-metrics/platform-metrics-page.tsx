import React, { Suspense, lazy, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/use-is-admin';
import {
  usePlatformMetrics,
  useLatestPlatformMetrics,
} from '@/api/hooks/usePlatformMetrics';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  TrendingUp,
  Users,
  Home,
  Hexagon,
  ClipboardList,
  MapPin,
  Cloud,
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { PlatformMetricsTrendChart } from './components/platform-metrics-trend-chart';
// Lazy: Leaflet touches `window` when imported, which would break the
// server-side prerender of the public pages (every route module is part of
// the server bundle), and the map is only needed on this admin page anyway.
const AllApiariesMap = lazy(() =>
  import('./components/all-apiaries-map').then(m => ({
    default: m.AllApiariesMap,
  })),
);

type DateRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

const DATE_RANGE_OPTIONS: DateRange[] = ['7d', '30d', '90d', '6m', '1y', 'all'];

const getDateRange = (
  range: DateRange,
): { startDate?: string; endDate?: string } => {
  const now = new Date();
  switch (range) {
    case '7d':
      return { startDate: format(subDays(now, 7), 'yyyy-MM-dd') };
    case '30d':
      return { startDate: format(subDays(now, 30), 'yyyy-MM-dd') };
    case '90d':
      return { startDate: format(subDays(now, 90), 'yyyy-MM-dd') };
    case '6m':
      return { startDate: format(subMonths(now, 6), 'yyyy-MM-dd') };
    case '1y':
      return { startDate: format(subMonths(now, 12), 'yyyy-MM-dd') };
    case 'all':
    default:
      return {};
  }
};

const PlatformMetricsPage: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const dateParams = useMemo(() => getDateRange(dateRange), [dateRange]);
  const {
    data: snapshots,
    isLoading,
    refetch,
  } = usePlatformMetrics(dateParams);
  const { data: latestSnapshot } = useLatestPlatformMetrics();

  // Redirect if not admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('platformMetrics.title')}</h1>
        <p className="text-muted-foreground">
          {t('platformMetrics.description')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('platformMetrics.totalUsers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSnapshot?.totalUsers ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('platformMetrics.active30d', {
                count: latestSnapshot?.activeUsers30Days ?? 0,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('platformMetrics.totalApiaries')}
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSnapshot?.totalApiaries ?? '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('platformMetrics.totalHives')}
            </CardTitle>
            <Hexagon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSnapshot?.totalHives ?? '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('platformMetrics.totalInspections')}
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSnapshot?.totalInspections ?? '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('platformMetrics.trendsTitle')}</CardTitle>
              <CardDescription>
                {t('platformMetrics.trendsDescription')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={dateRange}
                onValueChange={v => setDateRange(v as DateRange)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {t(`platformMetrics.dateRanges.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                {t('common:actions.refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PlatformMetricsTrendChart data={snapshots} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Additional Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('platformMetrics.additionalTitle')}</CardTitle>
          <CardDescription>
            {t('platformMetrics.additionalDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('platformMetrics.actions')}
              </p>
              <p className="text-xl font-semibold">
                {latestSnapshot?.totalActions ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('platformMetrics.queens')}
              </p>
              <p className="text-xl font-semibold">
                {latestSnapshot?.totalQueens ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('platformMetrics.harvests')}
              </p>
              <p className="text-xl font-semibold">
                {latestSnapshot?.totalHarvests ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('platformMetrics.equipmentItems')}
              </p>
              <p className="text-xl font-semibold">
                {latestSnapshot?.totalEquipmentItems ?? '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Fetches Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            {t('platformMetrics.weatherTitle')}
          </CardTitle>
          <CardDescription>
            {t('platformMetrics.weatherDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('platformMetrics.totalFetches')}
              </p>
              <p className="text-3xl font-bold">
                {latestSnapshot?.weatherFetches24h ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('platformMetrics.errors')}
              </p>
              <p className="text-3xl font-bold">
                {latestSnapshot?.weatherFetchErrors24h ?? '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Users Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('platformMetrics.activeUsersTitle')}
          </CardTitle>
          <CardDescription>
            {t('platformMetrics.activeUsersDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('platformMetrics.dateRanges.7d')}
              </p>
              <p className="text-3xl font-bold">
                {latestSnapshot?.activeUsers7Days ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('platformMetrics.dateRanges.30d')}
              </p>
              <p className="text-3xl font-bold">
                {latestSnapshot?.activeUsers30Days ?? '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Apiaries Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('platformMetrics.allApiariesTitle')}
          </CardTitle>
          <CardDescription>
            {t('platformMetrics.allApiariesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <AllApiariesMap />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformMetricsPage;
