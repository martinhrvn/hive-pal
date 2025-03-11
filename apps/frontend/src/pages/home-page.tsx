import { useHiveControllerFindAll } from 'api-client';
import { HiveList } from '@/pages/hive/components';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { HomeActionSidebar } from '@/components/home-action-sidebar';

export const HomePage = () => {
  const { data, isLoading, refetch } = useHiveControllerFindAll();
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Page>
      <MainContent>
        <HiveList hives={data?.data ?? []} />
      </MainContent>
      <Sidebar>
        <HomeActionSidebar onRefreshData={refetch} />
      </Sidebar>
    </Page>
  );
};
