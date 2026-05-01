import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BoxConfigurator } from './box-configurator';
import { ActionSideBar } from '@/pages/hive/hive-detail-page/action-sidebar.tsx';
import { QueenInformation } from '@/pages/hive/hive-detail-page/queen-information.tsx';
import { FeedingSection } from './feeding-section';
import { HiveTimeline } from './hive-timeline';
import { HiveSettings } from './hive-settings';
import { HiveCharts } from './charts';
import { HiveHeaderStats } from './hive-header-stats';
import { StatisticCards } from './statistic-cards';
import { useHive } from '@/api/hooks';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';
import { QueenHistoryTab } from './queen-history-tab';
import { HiveStatusButton } from './hive-status-button';
import { buildBoxGradient } from '@/utils/box-gradient';
import { useImageDisplayStore } from '@/stores/image-display-store';
import { AlertTriangle } from 'lucide-react';
import { WARNING_LABELS } from '@/utils/warning-labels';

export const HiveDetailPage = () => {
  const { id: hiveId } = useParams<{ id: string }>();
  const { data: hive, error, refetch } = useHive(hiveId as string);
  const { setHiveContext, clearContext } = useBreadcrumbStore();
  const { mode: imageMode } = useImageDisplayStore();
  const [activeTab, setActiveTab] = useState('overview');
  const isSide = imageMode === 'side';

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
    <div className="p-2 sm:p-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-8 xl:col-span-9">
          {/* Hive header card */}
          <div className={`rounded-lg overflow-hidden mb-4 ${isSide ? 'flex flex-col sm:flex-row' : ''}`}>
            {imageMode !== 'hidden' && (
              hive?.featurePhotoUrl ? (
                <img
                  src={hive.featurePhotoUrl}
                  alt={`${hive.name} feature photo`}
                  className={isSide
                    ? 'w-full sm:w-[150px] h-40 sm:h-auto min-h-[140px] object-cover flex-shrink-0'
                    : 'w-full h-40 object-cover'}
                />
              ) : (
                <div
                  className={isSide
                    ? 'w-full sm:w-[150px] h-32 sm:h-auto min-h-[140px]  flex-shrink-0'
                    : 'w-full h-32 '}
                  style={{ background: buildBoxGradient(hive?.boxes) }}
                />
              )
            )}
            <div className={`pt-3 flex-1 min-w-0 ${isSide ? 'sm:pl-4' : ''}`}>
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-xl sm:text-2xl font-semibold">
                {hive?.name}
              </h1>
              {hiveId && (
                <HiveStatusButton hiveId={hiveId} status={hive?.status} />
              )}
            </div>
            {hive?.installationDate && (
              <p className="text-sm text-gray-500">
                Installed on{' '}
                {new Date(hive?.installationDate).toLocaleDateString()}
              </p>
            )}
            {hive?.notes && <p className="mt-2 text-gray-700">{hive.notes}</p>}

            {/* Compact stats section */}
            <div className="border-t mt-3 pt-3">
              {hive?.inspectionType === 'subjective' && hive?.hiveScore && (
                <StatisticCards score={hive.hiveScore} variant="inline" />
              )}
              {hive?.inspectionType === 'data_driven' && hiveId && (
                <HiveHeaderStats hiveId={hiveId} />
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
                <QueenInformation
                  hiveId={hive?.id}
                  activeQueen={hive?.activeQueen}
                  onQueenUpdated={() => refetch()}
                  variant="inline"
                />
                {hive && <FeedingSection hiveId={hive.id} variant="inline" />}
              </div>
            </div>
            </div>
          </div>

          {/* Tabs for different sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 sm:mb-6">
            <TabsList className="mb-3 sm:mb-4 flex-wrap h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="boxes" className="text-xs sm:text-sm">
                Boxes
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">
                Settings
              </TabsTrigger>
              <TabsTrigger value="queens" className="text-xs sm:text-sm">
                Queen History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {(hive?.hiveScore?.warnings?.length ?? 0) > 0 && (
                <Alert className="mb-4 border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-600">
                  <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
                  <AlertTitle className="font-semibold">Inspection Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 space-y-1">
                      {hive!.hiveScore!.warnings.map((w) => (
                        <li key={w}>{WARNING_LABELS[w] ?? w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <HiveTimeline hiveId={hiveId} apiaryId={hive?.apiaryId} />
            </TabsContent>

            <TabsContent value="analytics">
              <HiveCharts hiveId={hiveId} inspectionType={hive?.inspectionType ?? 'data_driven'} hiveScore={hive?.hiveScore} />
            </TabsContent>

            <TabsContent value="boxes">
              <BoxConfigurator hive={hive} />
            </TabsContent>

            <TabsContent value="settings">
              <HiveSettings hive={hive} onHiveUpdated={refetch} />
            </TabsContent>

            <TabsContent value="queens">
              {hive && <QueenHistoryTab hiveId={hive.id} activeQueen={hive.activeQueen} />}
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Sidebar - Hidden on mobile, visible on larger screens */}
        <div className="lg:col-span-4 xl:col-span-3">
          <ActionSideBar hiveId={hive?.id} onRefreshData={refetch} />
        </div>
      </div>
    </div>
  );
};
