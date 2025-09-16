import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['apiary', 'common']);
  const { id } = useParams<{ id: string }>();
  const { data: apiary, isLoading, refetch } = useApiary(id ?? '');

  if (isLoading) {
    return <div>{t('common:status.loading')}</div>;
  }

  if (!apiary) {
    return <div>{t('apiary:detail.notFound')}</div>;
  }

  return (
    <Page>
      <MainContent>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{apiary.name}</h1>
          <p className="text-muted-foreground">
            {apiary.location || t('apiary:detail.noLocationSpecified')}
          </p>
        </div>

        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              {t('apiary:detail.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="hives">
              {t('apiary:detail.tabs.hives')}
            </TabsTrigger>
            <TabsTrigger value="location">
              {t('apiary:detail.tabs.location')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('apiary:detail.apiaryInformation')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">
                        {t('apiary:fields.name')}:
                      </span>{' '}
                      {apiary.name}
                    </div>
                    <div>
                      <span className="font-medium">
                        {t('apiary:fields.location')}:
                      </span>{' '}
                      {apiary.location || t('apiary:fields.notSpecified')}
                    </div>
                    <div>
                      <span className="font-medium">
                        {t('apiary:fields.coordinates')}:
                      </span>{' '}
                      {apiary.latitude && apiary.longitude
                        ? `${apiary.latitude.toFixed(6)}, ${apiary.longitude.toFixed(6)}`
                        : t('apiary:fields.notSpecified')}
                    </div>
                    <div>
                      <span className="font-medium">{t('hive:plural')}:</span>{' '}
                      {0}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {apiary.latitude && apiary.longitude && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('apiary:detail.locationMap')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <MapPicker
                        initialLocation={{
                          lat: apiary.latitude,
                          lng: apiary.longitude,
                        }}
                        readOnly
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
            <Section title={t('apiary:detail.apiaryLocation')}>
              {apiary.latitude && apiary.longitude ? (
                <div className="h-[400px]">
                  <MapPicker
                    initialLocation={{
                      lat: apiary.latitude,
                      lng: apiary.longitude,
                    }}
                    readOnly
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('apiary:detail.noCoordinates')}
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
