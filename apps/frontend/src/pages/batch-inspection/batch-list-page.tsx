import * as React from 'react';
import { useNavigate } from 'react-router';
import {
  useBatchInspections,
  useStartBatchInspection,
  useDeleteBatchInspection,
} from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApiary } from '@/hooks/use-apiary';
import {
  PlayCircle,
  Eye,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  Timer,
} from 'lucide-react';
import { BatchInspectionStatus } from 'shared-schemas';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/use-date-format';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const BatchListPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['inspection', 'common']);
  const { formatDate, formatDateTime } = useDateFormat();
  const { data: batches, isLoading, error } = useBatchInspections();
  const { viewAllApiaries, apiaries } = useApiary();
  const { mutate: startBatch, isPending: isStarting } =
    useStartBatchInspection();
  const { mutate: deleteBatch, isPending: isDeleting } =
    useDeleteBatchInspection();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState<string | null>(
    null,
  );

  const handleStartBatch = (id: string) => {
    startBatch(id, {
      onSuccess: () => {
        navigate(`/batch-inspections/${id}/inspect`);
      },
      onError: error => {
        console.error('Failed to start batch:', error);
        toast.error(t('inspection:batch.list.startFailed'));
      },
    });
  };

  const handleDeleteBatch = (id: string) => {
    deleteBatch(id, {
      onSuccess: () => {
        // Batch list will auto-refresh via React Query
        setDeleteDialogOpen(null);
      },
      onError: error => {
        console.error('Failed to delete batch:', error);
        toast.error(t('inspection:batch.list.deleteFailed'));
        setDeleteDialogOpen(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>
            {t('inspection:batch.list.loadFailed')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: BatchInspectionStatus) => {
    switch (status) {
      case BatchInspectionStatus.DRAFT:
        return 'secondary';
      case BatchInspectionStatus.IN_PROGRESS:
        return 'default';
      case BatchInspectionStatus.COMPLETED:
        return 'outline';
      case BatchInspectionStatus.CANCELLED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: BatchInspectionStatus) => {
    return t(`inspection:batch.status.${status}`, {
      defaultValue: status.replace('_', ' '),
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {t('inspection:batch.list.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('inspection:batch.list.subtitle')}
          </p>
        </div>
        <Button onClick={() => navigate('/inspections/schedule')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('inspection:batch.list.newBatch')}
        </Button>
      </div>

      {!batches || batches.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('inspection:batch.list.emptyTitle')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('inspection:batch.list.emptyDescription')}
              </p>
              <Button onClick={() => navigate('/inspections/schedule')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('inspection:schedule.createBatchInspection')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map(batch => (
            <Card key={batch.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{batch.name}</CardTitle>
                    {viewAllApiaries && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {apiaries?.find(a => a.id === batch.apiaryId)?.name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('inspection:batch.list.hiveCount', {
                        count: batch.progress.total,
                      })}
                      {' • '}
                      {batch.startedAt
                        ? t('inspection:batch.startedAt', {
                            date: formatDateTime(batch.startedAt),
                          })
                        : t('inspection:batch.createdAt', {
                            date: formatDate(batch.createdAt),
                          })}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(batch.status)}>
                    {getStatusLabel(batch.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {batch.progress.completed}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {t('inspection:batch.progress.completed')}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {batch.progress.pending}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('inspection:batch.progress.remaining')}
                    </div>
                  </div>
                  {batch.progress.elapsedMinutes !== null && (
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {t('inspection:batch.minutes', {
                          minutes: batch.progress.elapsedMinutes,
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Timer className="h-3 w-3" />
                        {t('inspection:batch.progress.elapsed')}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {batch.status === BatchInspectionStatus.DRAFT && (
                    <>
                      <Button
                        onClick={() => handleStartBatch(batch.id)}
                        disabled={isStarting}
                        className="flex-1"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {t('inspection:batch.list.startInspection')}
                      </Button>
                      <Dialog
                        open={deleteDialogOpen === batch.id}
                        onOpenChange={open =>
                          setDeleteDialogOpen(open ? batch.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {t('inspection:batch.list.deleteTitle')}
                            </DialogTitle>
                            <DialogDescription>
                              {t('inspection:batch.list.deleteDescription')}
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteDialogOpen(null)}
                            >
                              {t('common:actions.cancel')}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteBatch(batch.id)}
                            >
                              {t('common:actions.delete')}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  {batch.status === BatchInspectionStatus.IN_PROGRESS && (
                    <Button
                      onClick={() =>
                        navigate(`/batch-inspections/${batch.id}/inspect`)
                      }
                      className="flex-1"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      {t('inspection:batch.list.continueInspection')}
                    </Button>
                  )}
                  {batch.status !== BatchInspectionStatus.DRAFT && (
                    <Button
                      onClick={() => navigate(`/batch-inspections/${batch.id}`)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t('inspection:batch.list.viewDetails')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
