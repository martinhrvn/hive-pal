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
  PendingBoxUpdateBanner,
} from './components';
import { AudioCard } from './components/audio-card';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { useHive, useInspection, useCreateShareLink } from '@/api/hooks';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';
import { isCloudMode } from '@/utils/feature-flags';
import { ShareResourceType, ShareLinkResponse } from 'shared-schemas';
import { ShareDialog } from '@/components/share/share-dialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const InspectionDetailPage = () => {
  const { t } = useTranslation('inspection');
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
      toast.error(t('inspection:detail.shareFailed'));
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
    return () => {
      setInspectionContext(undefined);
    };
  }, [inspection, hive, setInspectionContext, setHiveContext]);

  if (isLoading) {
    return (
      <div className="p-6 text-stone-500 dark:text-stone-400">
        {t('inspection:detail.loading')}
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <Alert variant="destructive" className="m-4">
        <X className="h-4 w-4" />
        <AlertTitle>{t('inspection:detail.error')}</AlertTitle>
        <AlertDescription>
          {t('inspection:detail.errorDescription')}{' '}
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => navigate(-1)}
          >
            {t('inspection:detail.goBack')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!inspection || !hive) {
    return (
      <div className="p-6 text-stone-500 dark:text-stone-400">
        {t('inspection:detail.notFound')}
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <PageGrid>
        <MainContent>
          {/* Pending box update banner (if any) */}
          <div className="mb-3">
            <PendingBoxUpdateBanner inspectionId={inspection.id} />
          </div>

          {/* Top bar: back link + share */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 -ml-2"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t('inspection:detail.back')}
            </Button>
            {isCloudMode() && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareClick}
                disabled={createShareLink.isPending}
                className="border-stone-200 dark:border-stone-800"
              >
                <Share2 className="mr-2 h-4 w-4" />
                {t('inspection:detail.share')}
              </Button>
            )}
          </div>

          {/* Editorial hero */}
          <div className="mb-4 sm:mb-6">
            <InspectionHeader
              hiveId={hive.id}
              apiaryId={hive.apiaryId}
              date={inspection.date}
              hiveName={hive.name}
              status={inspection.status}
              score={inspection.score ?? null}
              temperature={inspection.temperature}
              weatherConditions={inspection.weatherConditions}
            />
          </div>

          {/* Status action prompt — only renders when scheduled / overdue */}
          <div className="mb-4 sm:mb-6 @container/status">
            <InspectionStatusCard
              inspectionId={inspection.id}
              status={inspection.status}
              inspectionDate={inspection.date}
            />
          </div>

          <div className="space-y-4 sm:space-y-5">
            <ObservationsCard
              observations={inspection.observations}
              inspectionType={hive.inspectionType ?? 'data_driven'}
            />
            <ActionsCard actions={inspection.actions ?? []} />
            <NotesCard notes={inspection.notes} />
            <AudioCard inspectionId={inspection.id} />
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
    </div>
  );
};
