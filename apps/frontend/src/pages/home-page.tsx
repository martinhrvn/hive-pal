import { HiveList } from '@/pages/hive/components';
import { MainContent, Page, Sidebar } from '@/components/layout/page-grid-layout';
import { HomeActionSidebar } from '@/components/home-action-sidebar';
import { HiveMinimap } from '@/components/hive-minimap';
import { InspectionStatusSummary } from '@/components/inspection-status-summary';
import { ReportsSummaryWidget } from '@/components/reports-summary-widget';
import { useHives } from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';

export const HomePage = () => {
  const { data, isLoading, refetch } = useHives();
  const { activeApiaryId } = useApiary();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Page>
      <MainContent>
        <div className="space-y-6">
          {/* Side by side on lg+ screens, stacked below */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InspectionStatusSummary />
            <ReportsSummaryWidget />
          </div>
          {activeApiaryId && (
            <HiveMinimap apiaryId={activeApiaryId} className="mb-6" />
          )}
          <HiveList hives={data ?? []} />
        </div>
      </MainContent>
      <Sidebar>
        <HomeActionSidebar onRefreshData={refetch} />
      </Sidebar>
    </Page>
  );
};
