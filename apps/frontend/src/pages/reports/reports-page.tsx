import { apiClient } from '@/api/client';
import { useApiaryStatistics, useApiaryTrends } from '@/api/hooks/useReports';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiary } from '@/hooks/use-apiary';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportPeriod } from 'shared-schemas';
import { toast } from 'sonner';
import { FeedingTotalsChart } from './components/charts/feeding-totals-chart';
import { FeedingTrendChart } from './components/charts/feeding-trend-chart';
import { HealthTrendChart } from './components/charts/health-trend-chart';
import { HiveScoreTrendChart } from './components/charts/hive-score-trend-chart';
import { HoneyProductionChart } from './components/charts/honey-production-chart';
import { ReportsHeader } from './components/reports-header';
import { ReportsSidebar } from './components/reports-sidebar';
import { StatisticsCards } from './components/statistics-cards';
import { HiveComparisonTable } from './components/tables/hive-comparison-table';

export const ReportsPage = () => {
  const { t } = useTranslation('common');
  const [period, setPeriod] = useState<ReportPeriod>('ytd');
  const [isExporting, setIsExporting] = useState(false);
  const { activeApiaryId, activeApiary } = useApiary();
  const {
    data: statistics,
    isLoading,
    refetch,
  } = useApiaryStatistics(activeApiaryId || undefined, period);
  const { data: trends, isLoading: isTrendsLoading } = useApiaryTrends(
    activeApiaryId || undefined,
    period,
  );

  const handleExportCsv = async () => {
    if (!activeApiaryId) return;

    setIsExporting(true);
    try {
      const response = await apiClient.get(
        `/api/reports/apiary/${activeApiaryId}/export/csv`,
        { params: { period }, responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `apiary-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('reports.export.success'));
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error(t('reports.export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!activeApiaryId) return;

    setIsExporting(true);
    try {
      const response = await apiClient.get(
        `/api/reports/apiary/${activeApiaryId}/export/pdf`,
        { params: { period }, responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `apiary-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('reports.export.success'));
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(t('reports.export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!activeApiaryId) {
    return (
      <PageGrid>
        <MainContent>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('reports.selectApiary')}
            </CardContent>
          </Card>
        </MainContent>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <MainContent>
        <div className="space-y-6">
          <ReportsHeader
            period={period}
            onPeriodChange={setPeriod}
            apiaryName={activeApiary?.name}
          />

          <StatisticsCards statistics={statistics} isLoading={isLoading} />

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">
                {t('reports.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="charts">
                {t('reports.tabs.charts')}
              </TabsTrigger>
              <TabsTrigger value="trends">
                {t('reports.tabs.trends')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6 pt-4">
              <HiveComparisonTable
                statistics={statistics}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="charts" className="space-y-6 pt-4">
              <HoneyProductionChart
                data={statistics?.honeyProduction.byHive}
                isLoading={isLoading}
              />
              <FeedingTotalsChart
                data={statistics?.feedingTotals.byHive}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="trends" className="space-y-6 pt-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {t('reports.charts.hiveScoreTrends')}
                  </h3>
                  <HiveScoreTrendChart
                    data={trends?.hiveHealthTrends}
                    isLoading={isTrendsLoading}
                  />
                </CardContent>
              </Card>
              <HealthTrendChart
                data={trends?.healthTrends}
                isLoading={isTrendsLoading}
              />
              <FeedingTrendChart
                data={trends?.feedingTrends}
                isLoading={isTrendsLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </MainContent>
      <PageAside>
        <ReportsSidebar
          period={period}
          onPeriodChange={setPeriod}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          onRefresh={handleRefresh}
          isExporting={isExporting}
        />
      </PageAside>
    </PageGrid>
  );
};
