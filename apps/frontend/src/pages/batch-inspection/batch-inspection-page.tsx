import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  X,
  ArrowRight,
} from 'lucide-react';
import { InspectionForm } from '@/pages/inspection/components/inspection-form';
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
              ? 'No more hives to inspect in this batch'
              : 'Failed to load batch inspection'}
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/batch-inspections')}>
          Back to Batch Inspections
        </Button>
      </div>
    );
  }

  if (!currentHive) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Batch Inspection Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              All hives in this batch have been inspected.
            </p>
            <Button onClick={() => navigate('/batch-inspections')}>
              Back to Batch Inspections
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
      onError: (error) => {
        console.error('Failed to skip hive:', error);
        alert('Failed to skip hive');
      },
    });
  };

  const handleInspectionSubmit = (data: any) => {
    // Transform inspection form data to API format
    const inspectionData = {
      ...data,
      hiveId: currentHive.batchInspectionHive.hiveId,
      date: new Date().toISOString(), // Use current date for batch inspections
    };

    createInspectionAndNext(
      {
        batchId: id!,
        inspectionData,
      },
      {
        onSuccess: (result) => {
          if (!result.next) {
            // Batch complete
            alert('Batch inspection completed!');
            navigate(`/batch-inspections/${id}`);
          }
          // Otherwise, the query will refetch and show the next hive
        },
        onError: (error) => {
          console.error('Failed to create inspection:', error);
          alert('Failed to save inspection');
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
                Hive {currentHive.position} of {progress.total}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {progress.completed}/{progress.total} Complete
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
                Completed
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{progress.pending}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Remaining
              </div>
            </div>
            {progress.elapsedMinutes !== null && (
              <div>
                <div className="text-2xl font-bold">
                  {progress.elapsedMinutes}m
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Timer className="h-3 w-3" />
                  Elapsed
                </div>
              </div>
            )}
            {progress.averageMinutesPerHive !== null && (
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(progress.averageMinutesPerHive)}m
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg per Hive
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
              <CardTitle>Current Hive</CardTitle>
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
              Skip Hive
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Inspection Form */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Form</CardTitle>
        </CardHeader>
        <CardContent>
          <InspectionForm
            hiveId={currentHive.batchInspectionHive.hiveId}
            mode="batch"
            onSubmitSuccess={handleInspectionSubmit}
            submitButtonText={
              currentHive.hasNext ? (
                <>
                  Save and Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                'Save and Finish'
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
            <DialogTitle>Skip this hive?</DialogTitle>
            <DialogDescription>
              This hive will be moved to the end of the queue. You can inspect
              it later in this batch.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSkipHive}>
              Skip Hive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
