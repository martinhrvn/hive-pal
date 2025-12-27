import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { PlatformMetricsTrendChart } from './components/platform-metrics-trend-chart';
import { AllApiariesMap } from './components/all-apiaries-map';

type DateRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

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
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const dateParams = useMemo(() => getDateRange(dateRange), [dateRange]);
  const { data: snapshots, isLoading, refetch } = usePlatformMetrics(dateParams);
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
        <h1 className="text-2xl font-bold">Platform Metrics</h1>
        <p className="text-muted-foreground">
          Monitor platform growth and usage statistics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSnapshot?.totalUsers ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestSnapshot?.activeUsers30Days ?? 0} active (30d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apiaries</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Hives</CardTitle>
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
              Total Inspections
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
              <CardTitle>Platform Metrics Trends</CardTitle>
              <CardDescription>
                Track platform growth and user activity over time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={dateRange}
                onValueChange={(v) => setDateRange(v as DateRange)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                Refresh
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
          <CardTitle>Additional Statistics</CardTitle>
          <CardDescription>
            Other tracked metrics from the latest snapshot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Actions</p>
              <p className="text-xl font-semibold">
                {latestSnapshot?.totalActions ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Queens</p>
              <p className="text-xl font-semibold">
                {latestSnapshot?.totalQueens ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Harvests</p>
              <p className="text-xl font-semibold">
                {latestSnapshot?.totalHarvests ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equipment Items</p>
              <p className="text-xl font-semibold">
                {latestSnapshot?.totalEquipmentItems ?? '-'}
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
            Active Users
          </CardTitle>
          <CardDescription>
            Users who created inspections or actions in the given period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
              <p className="text-3xl font-bold">
                {latestSnapshot?.activeUsers7Days ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
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
            All Apiaries
          </CardTitle>
          <CardDescription>
            Map of all apiaries with coordinates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AllApiariesMap />
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformMetricsPage;
