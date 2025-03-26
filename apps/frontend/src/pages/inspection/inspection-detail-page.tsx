import { useParams, useNavigate } from 'react-router-dom';
import {
  useHiveControllerFindOne,
  useInspectionsControllerFindOne,
} from 'api-client';
import { ChevronLeft, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  InspectionDetailSidebar,
  InspectionHeader,
  NotesCard,
  ObservationsCard,
} from './components';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { StatisticCards } from '@/pages/hive/hive-detail-page/statistic-cards.tsx';

export const InspectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: inspection,
    isLoading,
    error,
  } = useInspectionsControllerFindOne(id ?? '', {
    query: { enabled: !!id, select: data => data.data },
  });
  const { data: hive } = useHiveControllerFindOne(inspection?.hiveId ?? '', {
    query: { enabled: !!inspection?.hiveId, select: data => data.data },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">Loading inspection details...</div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load inspection details.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <Page>
      <MainContent>
        <InspectionHeader
          hiveName={hive?.name || ''}
          hiveId={inspection.hiveId}
          date={inspection.date}
          temperature={inspection.temperature ?? undefined}
          weatherConditions={inspection.weatherConditions ?? undefined}
        />
        <div className="flex gap-4 mb-6"></div>
        <StatisticCards score={inspection.score} />
        <ObservationsCard observations={inspection.observations} />
        <NotesCard notes={inspection.notes} />
      </MainContent>

      <Sidebar>
        <InspectionDetailSidebar
          inspectionId={id || ''}
          hiveId={inspection.hiveId}
        />
      </Sidebar>
    </Page>
  );
};
