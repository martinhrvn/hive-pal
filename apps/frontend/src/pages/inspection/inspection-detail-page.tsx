import { useParams, useNavigate } from 'react-router-dom';
import { useHiveControllerFindOne } from 'api-client';
import { ChevronLeft, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  ActionsCard,
  InspectionDetailSidebar,
  InspectionHeader,
  NotesCard,
  ObservationsCard,
} from './components';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { StatisticCards } from '@/pages/hive/hive-detail-page/statistic-cards.tsx';
import { useInspection } from '@/api/hooks';

export const InspectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: inspection,
    isLoading,
    error,
  } = useInspection(id ?? '', {
    enabled: !!id,
  });

  const { data: hive } = useHiveControllerFindOne(inspection?.hiveId ?? '', {
    query: { enabled: !!inspection?.hiveId, select: data => data.data },
  });

  if (isLoading) {
    return <div>Loading inspection...</div>;
  }

  if (error || !inspection) {
    return (
      <Alert variant="destructive">
        <X className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load inspection details.{' '}
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!inspection || !hive) {
    return <div>Inspection not found</div>;
  }

  return (
    <Page>
      <MainContent>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <InspectionHeader
            hiveId={hive.id}
            date={inspection.date}
            hiveName={hive.name}
          />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* First column */}
            <div className="space-y-6">
              <ObservationsCard observations={inspection.observations} />
              <NotesCard notes={inspection.notes} />
            </div>

            {/* Second column */}
            <div className="space-y-6">
              <ActionsCard actions={inspection.actions ?? []} />
              {hive && <StatisticCards score={hive.hiveScore} />}
            </div>
          </div>
        </div>
      </MainContent>

      <Sidebar>
        <InspectionDetailSidebar
          inspectionId={inspection.id}
          hiveId={hive.id}
        />
      </Sidebar>
    </Page>
  );
};
