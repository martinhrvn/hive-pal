import * as React from 'react';
import { useParams, useNavigate } from 'react-router';
import type { CreateInspection } from 'shared-schemas';
import {
  useBatchInspection,
  useCurrentHiveToInspect,
  useSkipHive,
  useCreateInspectionAndNext,
} from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Timer,
  CheckCircle2,
  SkipForward,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { InspectionForm } from '@/pages/inspection/components/inspection-form';
import type { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const BatchInspectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['inspection', 'common']);
  const [showSkipDialog, setShowSkipDialog] = React.useState(false);

  const {
    data: batchInspection,
    isLoading: batchLoading,
    error: batchError,
  } = useBatchInspection(id!, { enabled: !!id });

  const {
    data: currentHive,
    isLoading: currentHiveLoading,
    error: currentHiveError,
  } = useCurrentHiveToInspect(id!, { enabled: !!id });

  const { mutate: skipHive, isPending: isSkipping } = useSkipHive();
  const { mutate: createInspectionAndNext, isPending: isSaving } =
    useCreateInspectionAndNext();

  if (batchLoading || currentHiveLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (batchError || currentHiveError || !batchInspection) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>
            {currentHiveError
              ? t('inspection:batch.inspect.noMoreHives')
              : t('inspection:batch.inspect.loadFailed')}
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/batch-inspections')}>
          {t('inspection:batch.backToList')}
        </Button>
      </div>
    );
  }

  if (!currentHive) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('inspection:batch.inspect.completeTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {t('inspection:batch.inspect.completeDescription')}
            </p>
            <Button onClick={() => navigate('/batch-inspections')}>
              {t('inspection:batch.backToList')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { progress } = batchInspection;
  const progressPercent = (progress.completed / progress.total) * 100;

  const handleSkipHive = () => {
    skipHive(id!, {
      onSuccess: () => {
        setShowSkipDialog(false);
      },
      onError: error => {
        console.error('Failed to skip hive:', error);
        toast.error(t('inspection:batch.inspect.skipFailed'));
      },
    });
  };

  const handleInspectionSubmit = (data: InspectionFormData) => {
    // Transform inspection form data to API format. The form action shape is
    // cast to the API CreateInspection shape at this submit boundary.
    const inspectionData = {
      ...data,
      hiveId: currentHive.batchInspectionHive.hiveId,
      date: new Date().toISOString(), // Use current date for batch inspections
    } as unknown as CreateInspection;

    createInspectionAndNext(
      {
        batchId: id!,
        inspectionData,
      },
      {
        onSuccess: result => {
          if (!result.next) {
            // Batch complete
            toast.success(t('inspection:batch.inspect.completed'));
            navigate(`/batch-inspections/${id}`);
          }
          // Otherwise, the query will refetch and show the next hive
        },
        onError: error => {
          console.error('Failed to create inspection:', error);
          toast.error(t('inspection:batch.inspect.saveFailed'));
        },
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{batchInspection.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('inspection:batch.inspect.hivePosition', {
                  position: currentHive.position,
                  total: progress.total,
                })}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {t('inspection:batch.inspect.completeBadge', {
                completed: progress.completed,
                total: progress.total,
              })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercent} className="h-3" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {progress.completed}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t('inspection:batch.progress.completed')}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{progress.pending}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {t('inspection:batch.progress.remaining')}
              </div>
            </div>
            {progress.elapsedMinutes !== null && (
              <div>
                <div className="text-2xl font-bold">
                  {t('inspection:batch.minutes', {
                    minutes: progress.elapsedMinutes,
                  })}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Timer className="h-3 w-3" />
                  {t('inspection:batch.progress.elapsed')}
                </div>
              </div>
            )}
            {progress.averageMinutesPerHive !== null && (
              <div>
                <div className="text-2xl font-bold">
                  {t('inspection:batch.minutes', {
                    minutes: Math.round(progress.averageMinutesPerHive),
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('inspection:batch.progress.avgPerHive')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Hive Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('inspection:batch.inspect.currentHive')}</CardTitle>
              <p className="text-lg font-semibold mt-1">
                {currentHive.batchInspectionHive.hive.name}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowSkipDialog(true)}
              disabled={isSkipping || isSaving}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              {t('inspection:batch.inspect.skipHive')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Inspection Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inspection:batch.inspect.inspectionForm')}</CardTitle>
        </CardHeader>
        <CardContent>
          <InspectionForm
            hiveId={currentHive.batchInspectionHive.hiveId}
            mode="batch"
            onSubmitSuccess={handleInspectionSubmit}
            submitButtonText={
              currentHive.hasNext ? (
                <>
                  {t('inspection:form.saveAndNext')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                t('inspection:batch.inspect.saveAndFinish')
              )
            }
            showCancelButton={false}
          />
        </CardContent>
      </Card>

      {/* Skip Confirmation Dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inspection:batch.inspect.skipTitle')}</DialogTitle>
            <DialogDescription>
              {t('inspection:batch.inspect.skipDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button onClick={handleSkipHive}>
              {t('inspection:batch.inspect.skipHive')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
