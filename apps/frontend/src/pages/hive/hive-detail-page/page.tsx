import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import { useFeatures } from '@/api/hooks/useFeatures';
import { AssistantChat } from '@/components/assistant/assistant-chat';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';
import { QueenHistoryTab } from './queen-history-tab';
import { HiveStatusButton } from './hive-status-button';
import { buildBoxGradient } from '@/utils/box-gradient';
import { useImageDisplayStore } from '@/stores/image-display-store';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { WARNING_LABELS } from '@/utils/warning-labels';

export const HiveDetailPage = () => {
  const { id: hiveId } = useParams<{ id: string }>();
  const location = useLocation();
  const { data: hive, error, refetch } = useHive(hiveId as string);
  const { data: features } = useFeatures();
  const { setHiveContext, clearContext } = useBreadcrumbStore();
  const { mode: imageMode } = useImageDisplayStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [assistantInit, setAssistantInit] = useState<{
    threadId?: string;
    prompt?: string;
  }>();
  const isSide = imageMode === 'side';

  // Handle a hand-off from the LLM prompt dialog: open the Assistant tab and
  // auto-send the generated prompt into a freshly created thread.
  useEffect(() => {
    const state = location.state as {
      assistantTab?: boolean;
      assistantThreadId?: string;
      assistantPrompt?: string;
    } | null;
    if (state?.assistantTab) {
      setActiveTab('assistant');
      setAssistantInit({
        threadId: state.assistantThreadId,
        prompt: state.assistantPrompt,
      });
      // Clear router state so it doesn't re-trigger on re-render/back nav.
      window.history.replaceState({}, '');
    }
  }, [location.state]);

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
          {/* Editorial hive header card */}
          <div className="@container/hive mb-4 sm:mb-6">
            <section
              className={cn(
                'group/hive relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-card',
                'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(120,80,20,0.08)]',
                'flex flex-col',
                isSide && '@md/hive:flex-row',
              )}
            >
              {imageMode !== 'hidden' && (
                <div
                  className={cn(
                    'relative overflow-hidden bg-stone-100 dark:bg-stone-900',
                    isSide
                      ? 'w-full @md/hive:w-[200px] @lg/hive:w-[240px] flex-shrink-0 h-32 @sm/hive:h-40 @md/hive:h-auto @md/hive:min-h-[220px]'
                      : 'w-full h-32 @sm/hive:h-40 @md/hive:h-44',
                  )}
                >
                  {hive?.featurePhotoUrl ? (
                    <img
                      src={hive.featurePhotoUrl}
                      alt={`${hive.name} feature photo`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: buildBoxGradient(hive?.boxes) }}
                    />
                  )}
                  <div
                    className={cn(
                      'absolute inset-0 pointer-events-none',
                      isSide
                        ? '@md/hive:bg-gradient-to-r @md/hive:from-transparent @md/hive:via-transparent @md/hive:to-card/15 bg-gradient-to-t from-card/40 via-transparent to-transparent'
                        : 'bg-gradient-to-t from-card/40 via-transparent to-transparent',
                    )}
                  />
                  <div className="absolute inset-0 pointer-events-none bg-amber-500/[0.04]" />
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col">
                {/* Overline + status pill */}
                <div className="px-4 @sm/hive:px-5 @lg/hive:px-6 pt-4 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 pt-0.5">
                      <span
                        className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)] shrink-0"
                        aria-hidden
                      />
                      <span className="font-overline text-stone-500 dark:text-stone-400 truncate">
                        {hive?.installationDate
                          ? `Established · ${format(new Date(hive.installationDate), 'MMM d, yyyy')}`
                          : 'Active hive'}
                      </span>
                    </div>
                    {hiveId && (
                      <div className="shrink-0">
                        <HiveStatusButton hiveId={hiveId} status={hive?.status} />
                      </div>
                    )}
                  </div>
                  <h1 className="mt-1.5 font-display text-2xl @sm/hive:text-3xl @lg/hive:text-4xl font-medium leading-[1.05] text-stone-900 dark:text-stone-50 break-words">
                    {hive?.name}
                  </h1>
                  {hive?.notes && (
                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                      {hive.notes}
                    </p>
                  )}
                </div>

                {/* Brood stats — hairline-separated */}
                {((hive?.inspectionType === 'subjective' && hive?.hiveScore) ||
                  (hive?.inspectionType === 'data_driven' && hiveId)) && (
                  <div className="border-t border-stone-200 dark:border-stone-800 mt-4 px-4 @sm/hive:px-5 @lg/hive:px-6 py-4">
                    {hive?.inspectionType === 'subjective' && hive?.hiveScore && (
                      <StatisticCards score={hive.hiveScore} variant="inline" />
                    )}
                    {hive?.inspectionType === 'data_driven' && hiveId && (
                      <HiveHeaderStats hiveId={hiveId} />
                    )}
                  </div>
                )}

                {/* Queen + feeding strip — bottom block with subtle stone wash, stacked rows */}
                <div className="mt-auto border-t border-stone-200 dark:border-stone-800 px-4 @sm/hive:px-5 @lg/hive:px-6 py-3 bg-stone-50/60 dark:bg-stone-900/40 flex flex-col gap-2">
                  <QueenInformation
                    hiveId={hive?.id}
                    activeQueen={hive?.activeQueen}
                    onQueenUpdated={() => refetch()}
                    variant="inline"
                  />
                  {hive && <FeedingSection hiveId={hive.id} variant="inline" />}
                </div>
              </div>
            </section>
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
              {features?.aiEnabled && (
                <TabsTrigger value="assistant" className="text-xs sm:text-sm">
                  Assistant
                </TabsTrigger>
              )}
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

            {features?.aiEnabled && (
              <TabsContent value="assistant">
                {hive?.apiaryId && hive?.id && (
                  <AssistantChat
                    key={assistantInit?.threadId ?? 'default'}
                    apiaryId={hive.apiaryId}
                    hiveId={hive.id}
                    threadId={assistantInit?.threadId}
                    initialMessage={assistantInit?.prompt}
                  />
                )}
              </TabsContent>
            )}
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
