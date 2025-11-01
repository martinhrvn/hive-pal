import { useParams, useNavigate } from 'react-router-dom';
import { useBatchInspection } from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Timer,
  Eye,
  XCircle,
} from 'lucide-react';
import { BatchInspectionStatus, BatchHiveStatus } from 'shared-schemas';
import { format } from 'date-fns';

export const BatchDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: batch,
    isLoading,
    error,
  } = useBatchInspection(id!, { enabled: !!id });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load batch inspection details
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/batch-inspections')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batch Inspections
        </Button>
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

  const getHiveStatusIcon = (status: BatchHiveStatus) => {
    switch (status) {
      case BatchHiveStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case BatchHiveStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/batch-inspections')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Batch Inspections
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{batch.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created {format(new Date(batch.createdAt), 'PPp')}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(batch.status)}>
              {batch.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {batch.progress.completed}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{batch.progress.pending}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Clock className="h-4 w-4" />
                Remaining
              </div>
            </div>
            {batch.progress.elapsedMinutes !== null && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">
                  {batch.progress.elapsedMinutes}m
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Timer className="h-4 w-4" />
                  Elapsed
                </div>
              </div>
            )}
            {batch.progress.averageMinutesPerHive !== null && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">
                  {Math.round(batch.progress.averageMinutesPerHive)}m
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Avg per Hive
                </div>
              </div>
            )}
          </div>

          {batch.startedAt && (
            <div className="text-sm text-muted-foreground">
              Started {format(new Date(batch.startedAt), 'PPp')}
            </div>
          )}

          {batch.completedAt && (
            <div className="text-sm text-muted-foreground">
              Completed {format(new Date(batch.completedAt), 'PPp')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hives ({batch.hives.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {batch.hives.map((batchHive) => (
              <div
                key={batchHive.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getHiveStatusIcon(batchHive.status)}
                  <div>
                    <p className="font-medium">{batchHive.hive.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Order: {batchHive.order + 1}
                      {batchHive.skippedCount > 0 &&
                        ` • Skipped ${batchHive.skippedCount} time${batchHive.skippedCount > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {batchHive.completedAt && (
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(batchHive.completedAt), 'PPp')}
                    </span>
                  )}
                  {batchHive.inspectionId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/inspections/${batchHive.inspectionId}`)
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
