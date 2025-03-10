import { useHiveControllerFindAll } from 'api-client';
import { HiveList } from '@/pages/hive/components';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const { data, isLoading } = useHiveControllerFindAll();
  const navigate = useNavigate();
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Page>
      <MainContent>
        <HiveList hives={data?.data ?? []} />
      </MainContent>
      <Sidebar>
        <Card>
          <CardContent>
            <Button onClick={() => navigate('/hives/create/')}>
              Create hive
            </Button>
          </CardContent>
        </Card>
      </Sidebar>
    </Page>
  );
};
