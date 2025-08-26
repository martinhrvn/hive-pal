import { HiveList } from '@/pages/hive/components';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { HomeActionSidebar } from '@/components/home-action-sidebar';
import { HiveMinimap } from '@/components/hive-minimap';
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
