import { lazy, Suspense, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Section } from '@/components/common/section';
import { ApiaryActionSidebar, HivesLayout } from './components';
import { SharingTab } from './components/sharing-tab';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { CalendarSubscriptionCard } from './components/calendar-subscription-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { useApiary, useHives } from '@/api/hooks';
import { useApiaryStore } from '@/hooks/use-apiary';

// Lazy load the map component (heavy ~200KB)
const MapPicker = lazy(() => import('@/components/common/map-picker'));

function MapLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-muted/50 rounded-md">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export const ApiaryDetailPage = () => {
  const { t } = useTranslation(['apiary', 'common']);
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setActiveApiaryId } = useApiaryStore();

  const { isOwner } = useApiaryPermission();

  const tabParam = searchParams.get('tab');
  const validTabs = ['overview', 'hives', 'location', ...(isOwner ? ['sharing'] : [])];
  const currentTab = validTabs.includes(tabParam ?? '') ? tabParam! : 'overview';

  const { data: apiary, isLoading, refetch } = useApiary(id ?? '');
  const { data: hives = [] } = useHives({ apiaryId: id ?? '' });

  useEffect(() => {
    if (id) setActiveApiaryId(id);
  }, [id, setActiveApiaryId]);

  const handleTabChange = (newTab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', newTab);
    setSearchParams(next);
  };

  if (isLoading) {
    return <div>{t('common:status.loading')}</div>;
  }

  if (!apiary) {
    return <div>{t('apiary:detail.notFound')}</div>;
  }

  return (
    <PageGrid>
      <MainContent>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{apiary.name}</h1>
          <p className="text-muted-foreground">
            {apiary.location || t('apiary:detail.noLocationSpecified')}
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="mb-6">
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
            {isOwner && (
              <TabsTrigger value="sharing">Sharing</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="overflow-hidden">
                {apiary.featurePhotoUrl ? (
                  <img
                    src={apiary.featurePhotoUrl}
                    alt={`${apiary.name} feature photo`}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-muted/50 flex items-center justify-center">
                    <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
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
                      {apiary.latitude != null && apiary.longitude != null
                        ? `${apiary.latitude.toFixed(6)}, ${apiary.longitude.toFixed(6)}`
                        : t('apiary:fields.notSpecified')}
                    </div>
                    <div>
                      <span className="font-medium">{t('hive:plural')}:</span>{' '}
                      {hives.length}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {apiary.latitude != null && apiary.longitude != null && (
                <div className="h-96">
                  <Suspense fallback={<MapLoader />}>
                    <MapPicker
                      initialLocation={{
                        lat: apiary.latitude,
                        lng: apiary.longitude,
                      }}
                      readOnly
                    />
                  </Suspense>
                </div>
              )}
            </div>

            <CalendarSubscriptionCard apiaryId={apiary.id} />
          </TabsContent>

          <TabsContent value="hives">
            <HivesLayout
              apiaryId={apiary.id}
              inspectionType={apiary.settings?.inspectionType ?? 'data_driven'}
            />
          </TabsContent>

          {isOwner && (
            <TabsContent value="sharing">
              <SharingTab apiaryId={apiary.id} />
            </TabsContent>
          )}

          <TabsContent value="location">
            <Section title={t('apiary:detail.apiaryLocation')}>
              {apiary.latitude != null && apiary.longitude != null ? (
                <div className="h-96">
                  <Suspense fallback={<MapLoader />}>
                    <MapPicker
                      initialLocation={{
                        lat: apiary.latitude,
                        lng: apiary.longitude,
                      }}
                      readOnly
                    />
                  </Suspense>
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
      <PageAside>
        <ApiaryActionSidebar
          apiaryId={apiary.id}
          onRefreshData={() => refetch()}
        />
      </PageAside>
    </PageGrid>
  );
};
