import { useParams } from 'react-router-dom';
import { Section } from '@/components/common/section';
import { ApiaryActionSidebar, HivesLayout } from './components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MapPicker from '@/components/common/map-picker';
import {
  MainContent,
  Page,
  Sidebar,
} from '@/components/layout/sidebar-layout.tsx';
import { useApiary } from '@/api/hooks';

export const ApiaryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: apiary, isLoading, refetch } = useApiary(id ?? '');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!apiary) {
    return <div>Apiary not found</div>;
  }

  return (
    <Page>
      <MainContent>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{apiary.name}</h1>
          <p className="text-muted-foreground">
            {apiary.location || 'No location specified'}
          </p>
        </div>

        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hives">Hives</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Apiary Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Name:</span> {apiary.name}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span>{' '}
                      {apiary.location || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Coordinates:</span>{' '}
                      {apiary.latitude && apiary.longitude
                        ? `${apiary.latitude.toFixed(6)}, ${apiary.longitude.toFixed(6)}`
                        : 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Hives:</span> {0}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {apiary.latitude && apiary.longitude && (
                <Card>
                  <CardHeader>
                    <CardTitle>Location Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <MapPicker
                        initialLocation={{
                          lat: apiary.latitude,
                          lng: apiary.longitude,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hives">
            <HivesLayout apiaryId={apiary.id} />
          </TabsContent>

          <TabsContent value="location">
            <Section title="Apiary Location">
              {apiary.latitude && apiary.longitude ? (
                <div className="h-[400px]">
                  <MapPicker
                    initialLocation={{
                      lat: apiary.latitude,
                      lng: apiary.longitude,
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No location coordinates available for this apiary
                </div>
              )}
            </Section>
          </TabsContent>
        </Tabs>
      </MainContent>
      <Sidebar>
        <ApiaryActionSidebar onRefreshData={() => refetch()} />
      </Sidebar>
    </Page>
  );
};
