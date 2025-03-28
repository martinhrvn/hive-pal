import { useParams } from 'react-router-dom';
import { HiveStatus } from '@/pages/hive/components';
import { Section } from '@/components/common/section';
import { InspectionTimeline } from '@/pages/inspection/components/inspection-timeline.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticCards } from './statistic-cards';
import { BoxConfigurator } from './box-configurator';
import { ActionSideBar } from '@/pages/hive/hive-detail-page/action-sidebar.tsx';
import { QueenInformation } from '@/pages/hive/hive-detail-page/queen-information.tsx';
import { useHive, useInspections } from '@/api/hooks';

export const HiveDetailPage = () => {
  const { id: hiveId } = useParams<{ id: string }>();
  const { data: hive, error, refetch } = useHive(hiveId as string);
  const { data: inspections } = useInspections({
    hiveId: hiveId,
  });
  if (error) {
    return <div>Error</div>;
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-9">
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
              <TabsTrigger value="boxes">Box Configurator</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* Queen Information */}
              {/* Statistics from latest inspection */}
              {hive && hive.hiveScore && (
                <StatisticCards score={hive.hiveScore} />
              )}
              <QueenInformation
                hiveId={hive?.id}
                activeQueen={hive?.activeQueen}
                onQueenUpdated={() => refetch()}
              />
              {/* Inspections timeline */}
              <Section title="Inspections">
                <InspectionTimeline inspections={inspections ?? []} />
              </Section>
            </TabsContent>

            <TabsContent value="boxes">
              <BoxConfigurator hive={hive} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Sidebar */}
        <div className="md:col-span-3">
          <ActionSideBar hiveId={hive?.id} onRefreshData={refetch} />
        </div>
      </div>
    </div>
  );
};
