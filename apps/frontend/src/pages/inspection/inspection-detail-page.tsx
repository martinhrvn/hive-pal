import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  ActionsCard,
  InspectionDetailSidebar,
  InspectionHeader,
  InspectionStatusCard,
  NotesCard,
  ObservationsCard,
  WeatherCard,
} from './components';
import { AudioCard } from './components/audio-card';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { StatisticCards } from '@/pages/hive/hive-detail-page/statistic-cards.tsx';
import { useHive, useInspection, useCreateShareLink } from '@/api/hooks';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';
import { isCloudMode } from '@/utils/feature-flags';
import { ShareResourceType, ShareLinkResponse } from 'shared-schemas';
import { ShareDialog } from '@/components/share/share-dialog';
import { toast } from 'sonner';

export const InspectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setInspectionContext, setHiveContext } = useBreadcrumbStore();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLinkResponse | null>(null);
  const createShareLink = useCreateShareLink();

  const handleShareClick = async () => {
    if (!id) return;
    try {
      const result = await createShareLink.mutateAsync({
        resourceType: ShareResourceType.INSPECTION,
        resourceId: id,
      });
      setShareLink(result);
      setShowShareDialog(true);
    } catch {
      toast.error('Failed to create share link');
    }
  };

  const {
    data: inspection,
    isLoading,
    error,
  } = useInspection(id ?? '', {
    enabled: !!id,
  });

  const { data: hive } = useHive(inspection?.hiveId ?? '', {
    enabled: !!inspection?.hiveId,
  });

  // Set breadcrumb context when data is loaded
  useEffect(() => {
    if (inspection && hive) {
      setInspectionContext({
        id: inspection.id,
        date: inspection.date,
        hiveId: inspection.hiveId,
      });
      setHiveContext({
        id: hive.id,
        name: hive.name,
      });
    }

    // Clear context on unmount
    return () => {
      setInspectionContext(undefined);
    };
  }, [inspection, hive, setInspectionContext, setHiveContext]);

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
    <PageGrid>
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

          <div className="flex items-center justify-between">
            <InspectionHeader
              hiveId={hive.id}
              date={inspection.date}
              hiveName={hive.name}
            />
            {isCloudMode() && (
              <Button
                variant="outline"
                onClick={handleShareClick}
                disabled={createShareLink.isPending}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {/* Top row: Score, Weather, and Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {hive && <StatisticCards score={hive.hiveScore} />}
              <WeatherCard
                temperature={inspection.temperature}
                weatherConditions={inspection.weatherConditions}
              />
              <InspectionStatusCard
                inspectionId={inspection.id}
                status={inspection.status}
                inspectionDate={inspection.date}
              />
            </div>

            {/* Full-width sections */}
            <ObservationsCard observations={inspection.observations} />
            <ActionsCard actions={inspection.actions ?? []} />
            <NotesCard notes={inspection.notes} />
            <AudioCard inspectionId={inspection.id} />
          </div>
        </div>
      </MainContent>

      <PageAside>
        <InspectionDetailSidebar
          inspectionId={inspection.id}
          hiveId={hive.id}
        />
      </PageAside>
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        shareLink={shareLink}
      />
    </PageGrid>
  );
};
