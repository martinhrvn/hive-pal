import { InspectionForm } from '@/pages/inspection/components/inspection-form';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInspection } from '@/api/hooks/useInspections';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { parseAiInspectionDraft } from '@/pages/inspection/lib/inspection-ai-draft';

type EditInspectionLocationState = {
  /** Raw AI draft in the canonical shape (validated by aiInspectionDraftSchema). */
  aiDraft?: unknown;
  aiSourceAudioId?: string;
};

export const EditInspectionPage = () => {
  const { t } = useTranslation('inspection');
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const fromScheduled = searchParams.get('from') === 'scheduled';
  const fromAi = searchParams.get('from') === 'ai';

  const state = (location.state ?? {}) as EditInspectionLocationState;

  const { data: inspection } = useInspection(id || '', {
    enabled: !!id && fromScheduled,
  });

  const parsedDraft = useMemo(
    () => (fromAi ? parseAiInspectionDraft(state.aiDraft) : null),
    [fromAi, state.aiDraft],
  );

  const aiDraft = parsedDraft?.formDraft;
  const resolvedAiSuggestedFields = parsedDraft?.suggestedFields ?? [];

  return (
    <div className="space-y-4">
      {fromScheduled && inspection && (
        <Alert className="mb-6">
          <Calendar className="size-4" />
          <AlertDescription>
            <div>
              {t('inspection:edit.completingFrom', {
                date: format(parseISO(inspection.date as string), 'EEEE, MMMM d, yyyy'),
              })}
            </div>
            <div className="mt-1 flex items-center gap-2 text-green-600">
              <CheckCircle className="size-4" />
              {t('inspection:edit.markedCompleted')}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <InspectionForm
        inspectionId={id}
        aiDraft={aiDraft}
        aiSuggestedFields={resolvedAiSuggestedFields}
      />
    </div>
  );
};