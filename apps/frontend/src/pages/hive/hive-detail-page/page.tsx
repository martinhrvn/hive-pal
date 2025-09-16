import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HiveStatus } from '@/pages/hive/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticCards } from './statistic-cards';
import { BoxConfigurator } from './box-configurator';
import { ActionSideBar } from '@/pages/hive/hive-detail-page/action-sidebar.tsx';
import { QueenInformation } from '@/pages/hive/hive-detail-page/queen-information.tsx';
import { FeedingSection } from './feeding-section';
import { HiveTimeline } from './hive-timeline';
import { HiveSettings } from './hive-settings';
import { HiveCharts } from './charts';
import { useHive } from '@/api/hooks';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';

export const HiveDetailPage = () => {
  const { id: hiveId } = useParams<{ id: string }>();
  const { data: hive, error, refetch } = useHive(hiveId as string);
  const { setHiveContext, clearContext } = useBreadcrumbStore();

  // Set breadcrumb context when hive data is loaded
  useEffect(() => {
    if (hive) {
      setHiveContext({
        id: hive.id,
        name: hive.name,
      });
      // Clear any child contexts when navigating to a hive
      clearContext('inspection');
      clearContext('queen');
      clearContext('harvest');
    }

    // Clear hive context on unmount
    return () => {
      setHiveContext(undefined);
    };
  }, [hive, setHiveContext, clearContext]);
  if (error) {
    return <div>Error</div>;
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-8 xl:col-span-9">
          {/* Hive header card */}
          <div className="rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-semibold">{hive?.name}</h1>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <HiveStatus status={hive?.status} />
              </span>
            </div>
            {hive?.installationDate && (
              <p className="text-sm text-gray-500">
                Installed on{' '}
                {new Date(hive?.installationDate).toLocaleDateString()}
              </p>
            )}
            {hive?.notes && <p className="mt-2 text-gray-700">{hive.notes}</p>}
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="overview" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="boxes">Box Configurator</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-4">
                {/* Three main cards in responsive grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Scores Card */}
                  {hive && hive.hiveScore && (
                    <StatisticCards score={hive.hiveScore} />
                  )}

                  {/* Queen Information Card */}
                  <QueenInformation
                    hiveId={hive?.id}
                    activeQueen={hive?.activeQueen}
                    onQueenUpdated={() => refetch()}
                  />

                  {/* Feeding Card */}
                  {hive && <FeedingSection hiveId={hive.id} />}
                </div>

                {/* Hive timeline */}
                <HiveTimeline hiveId={hiveId} />
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <HiveCharts hiveId={hiveId} hiveScore={hive?.hiveScore} />
            </TabsContent>

            <TabsContent value="boxes">
              <BoxConfigurator hive={hive} />
            </TabsContent>

            <TabsContent value="settings">
              <HiveSettings hive={hive} onHiveUpdated={refetch} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Sidebar */}
        <div className="col-span-4 xl:col-span-3">
          <ActionSideBar hiveId={hive?.id} onRefreshData={refetch} />
        </div>
      </div>
    </div>
  );
};
