import {
  useHiveControllerFindOne,
  useInspectionsControllerFindAll,
} from 'api-client';
import { useParams, Link } from 'react-router-dom';
import { HiveStatus } from '@/pages/hive/components';
import { Section } from '@/components/common/section';
import { Button, buttonVariants } from '@/components/ui/button';
import { InspectionTimeline } from '@/pages/inspection/components/inspection-timeline.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticCards } from './statistic-cards';
import { BoxConfigurator } from './box-configurator';

export const HiveDetailPage = () => {
  const { id: hiveId } = useParams<{ id: string }>();
  const { data: hive, error } = useHiveControllerFindOne(hiveId ?? '', {
    query: {
      select: data => data.data,
    },
  });
  const { data: inspections } = useInspectionsControllerFindAll(
    {
      hiveId: hiveId,
    },
    { query: { select: data => data.data } },
  );
  if (error) {
    return <div>Error: {error.message}</div>;
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
            {hive?.notes && (
              <p className="mt-2 text-gray-700">{hive.notes}</p>
            )}
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="overview" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="boxes">Box Configurator</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {/* Statistics from latest inspection */}
              {inspections && inspections.length > 0 && (
                <StatisticCards inspections={inspections} />
              )}
              
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
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              <Link
                to={hive?.id ? `/hives/${hive.id}/inspections/create` : '/inspections/create'}
                className={buttonVariants({ variant: 'default', className: "w-full justify-start" })}
              >
                Add Inspection
              </Link>
              
              <Separator className="my-2" />
              
              <Link
                to={hive?.id ? `/hives/${hive.id}/edit` : '#'}
                className={buttonVariants({ variant: 'outline', className: "w-full justify-start" })}
              >
                Edit Hive
              </Link>
              
              <Button
                variant="destructive"
                className="w-full justify-start mt-4"
                disabled={!hive?.id}
              >
                Remove Hive
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};