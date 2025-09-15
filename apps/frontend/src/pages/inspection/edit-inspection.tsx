import { InspectionForm } from '@/pages/inspection/components/inspection-form';
import { useParams, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Calendar } from 'lucide-react';
import { useInspection } from '@/api/hooks/useInspections';
import { format, parseISO } from 'date-fns';

export const EditInspectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromScheduled = searchParams.get('from') === 'scheduled';

  const { data: inspection } = useInspection(id || '', {
    enabled: !!id && fromScheduled,
  });

  return (
    <div className="space-y-4">
      {fromScheduled && inspection && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Completing scheduled inspection from{' '}
                {format(
                  parseISO(inspection.date as string),
                  'EEEE, MMMM d, yyyy',
                )}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-80">
              This inspection will be marked as completed when you save your
              changes.
            </p>
          </AlertDescription>
        </Alert>
      )}
      <InspectionForm inspectionId={id} />
    </div>
  );
};
