import { HiveList } from '@/pages/hive/components';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { HomeActionSidebar } from '@/components/home-action-sidebar';
import { useHives } from '@/api/hooks';

export const HomePage = () => {
  const { data, isLoading, refetch } = useHives();
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Page>
      <MainContent>
        <HiveList hives={data ?? []} />
      </MainContent>
      <Sidebar>
        <HomeActionSidebar onRefreshData={refetch} />
      </Sidebar>
    </Page>
  );
};
