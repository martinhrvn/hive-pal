import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { HiveProvenance } from './split/hive-provenance';
import { HiveTodos } from './hive-todos';
import { TreatmentSummary } from './treatment-summary';
import { buildBoxGradient } from '@/utils/box-gradient';
import { useImageDisplayStore } from '@/stores/image-display-store';
import { AlertTriangle, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { warningLabelKey } from '@/utils/warning-labels';
import { FeaturePhoto } from '@/components/common/feature-photo';
import { useDateFormat } from '@/hooks/use-date-format';
import {
  DetailAside,
  DetailGrid,
  DetailMain,
} from '@/components/layout/page-grid-layout';
import {
  EditorialCard,
  EditorialCardBody,
  EditorialCardHeader,
  EditorialCardOverline,
  EditorialCardStrip,
  EditorialCardTitle,
} from '@/components/common/editorial-card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HiveMinimap } from '@/components/hive-minimap';
import { HiveHubHiveCard } from './hivehub-hive-card';

export const HiveDetailPage = () => {
  const { t } = useTranslation('hive');
  const { formatDate } = useDateFormat();
  const { id: hiveId } = useParams<{ id: string }>();
  const location = useLocation();
  const { data: hive, error, refetch } = useHive(hiveId as string);
  const { data: features } = useFeatures();
  const { setHiveContext, clearContext } = useBreadcrumbStore();
  const imageMode = useImageDisplayStore(state => state.mode);
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
      globalThis.history.replaceState({}, '');
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
    return <div>{t('detail.error')}</div>;
  }

  return (
    <DetailGrid>
      <DetailMain>
        <EditorialCard
          className={cn('mb-4 sm:mb-6', isSide && '@md/editorial:flex-row')}
        >
          {imageMode !== 'hidden' && (
            <FeaturePhoto
              src={hive?.featurePhotoUrl}
              alt={t('detail.featurePhotoAlt', { name: hive?.name })}
              fallback={buildBoxGradient(hive?.boxes)}
              className={
                isSide
                  ? 'h-32 w-full shrink-0 @sm/editorial:h-40 @md/editorial:h-auto @md/editorial:min-h-[220px] @md/editorial:w-[200px] @lg/editorial:w-[240px]'
                  : 'h-32 w-full @sm/editorial:h-40 @md/editorial:h-44'
              }
              overlayClassName={cn(
                isSide &&
                  '@md/editorial:bg-gradient-to-r @md/editorial:from-transparent @md/editorial:to-card/15',
              )}
              tint
            />
          )}

          <EditorialCardBody>
            <EditorialCardHeader>
              <EditorialCardOverline
                trailing={
                  <>
                    {hive?.apiaryId && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            aria-label={t('detail.showApiaryLayout')}
                            title={t('detail.showApiaryLayout')}
                          >
                            <Map className="size-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-auto max-w-[min(90vw,520px)] p-0"
                        >
                          <HiveMinimap
                            apiaryId={hive.apiaryId}
                            highlightedHiveId={hive.id}
                            className="border-0 shadow-none"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    {hiveId && (
                      <HiveStatusButton
                        hiveId={hiveId}
                        status={hive?.status}
                        apiaryId={hive?.apiaryId}
                      />
                    )}
                  </>
                }
              >
                {hive?.installationDate
                  ? t('detail.established', {
                      date: formatDate(hive.installationDate),
                    })
                  : t('detail.activeHive')}
              </EditorialCardOverline>
              <EditorialCardTitle>{hive?.name}</EditorialCardTitle>
              {hive?.notes && (
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                  {hive.notes}
                </p>
              )}
              {hive && <HiveProvenance hive={hive} />}
            </EditorialCardHeader>

            {/* Brood stats */}
            {((hive?.inspectionType === 'subjective' && hive?.hiveScore) ||
              (hive?.inspectionType === 'data_driven' && hiveId)) && (
              <EditorialCardStrip>
                {hive?.inspectionType === 'subjective' && hive?.hiveScore && (
                  <StatisticCards score={hive.hiveScore} variant="inline" />
                )}
                {hive?.inspectionType === 'data_driven' && hiveId && (
                  <HiveHeaderStats hiveId={hiveId} />
                )}
              </EditorialCardStrip>
            )}

            {/* Queen + feeding */}
            <EditorialCardStrip muted className="flex flex-col gap-2">
              <QueenInformation
                hiveId={hive?.id}
                activeQueen={hive?.activeQueen}
                onQueenUpdated={() => refetch()}
                variant="inline"
              />
              {hive && <FeedingSection hiveId={hive.id} variant="inline" />}
            </EditorialCardStrip>
          </EditorialCardBody>
        </EditorialCard>

        {/* Tabs for different sections */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-4 sm:mb-6"
        >
          <TabsList className="mb-3 sm:mb-4 flex-wrap h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              {t('detail.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              {t('detail.tabs.analytics')}
            </TabsTrigger>
            <TabsTrigger value="boxes" className="text-xs sm:text-sm">
              {t('detail.tabs.boxes')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              {t('detail.tabs.settings')}
            </TabsTrigger>
            <TabsTrigger value="queens" className="text-xs sm:text-sm">
              {t('detail.tabs.queens')}
            </TabsTrigger>
            {features?.aiEnabled && (
              <TabsTrigger value="assistant" className="text-xs sm:text-sm">
                {t('detail.tabs.assistant')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            {(hive?.hiveScore?.warnings?.length ?? 0) > 0 && (
              <Alert className="mb-4 border-warning bg-warning-muted text-warning-foreground">
                <AlertTriangle className="size-4 !text-warning" />
                <AlertTitle className="font-semibold">
                  {t('detail.inspectionWarnings')}
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-1">
                    {hive!.hiveScore!.warnings.map(w => (
                      <li key={w}>
                        {t(warningLabelKey(w), { defaultValue: w })}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {hiveId && <HiveTodos hiveId={hiveId} apiaryId={hive?.apiaryId} />}
            {hiveId && <TreatmentSummary hiveId={hiveId} />}
            <HiveTimeline hiveId={hiveId} apiaryId={hive?.apiaryId} />
          </TabsContent>

          <TabsContent value="analytics">
            <HiveCharts
              hiveId={hiveId}
              inspectionType={hive?.inspectionType ?? 'data_driven'}
              hiveScore={hive?.hiveScore}
            />
          </TabsContent>

          <TabsContent value="boxes">
            <BoxConfigurator hive={hive} />
          </TabsContent>

          <TabsContent value="settings">
            <HiveSettings hive={hive} onHiveUpdated={refetch} />
          </TabsContent>

          <TabsContent value="queens">
            {hive && (
              <QueenHistoryTab
                hiveId={hive.id}
                activeQueen={hive.activeQueen}
              />
            )}
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
      </DetailMain>

      <DetailAside>
        <ActionSideBar hiveId={hive?.id} onRefreshData={refetch} />
        {hiveId && <HiveHubHiveCard hiveId={hiveId} />}
      </DetailAside>
    </DetailGrid>
  );
};
