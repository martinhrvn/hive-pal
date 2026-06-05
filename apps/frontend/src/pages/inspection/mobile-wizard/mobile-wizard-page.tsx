import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  inspectionSchema,
  subjectiveInspectionSchema,
  type InspectionFormData,
} from '@/pages/inspection/components/inspection-form/schema';
import { useHive, useUpsertInspection } from '@/api/hooks';
import { uploadPendingPhotos } from '@/pages/inspection/components/inspection-form/upload-pending-photos';
import { uploadPendingRecordings } from '@/pages/inspection/components/inspection-form/upload-pending-recordings';
import { InspectionStatus } from 'shared-schemas';
import { WizardShell } from './wizard-shell';
import { VitalsStep } from './steps/vitals-step';
import { StoresStep } from './steps/stores-step';
import { QueenStep } from './steps/queen-step';
import { MediaNotesStep } from './steps/media-notes-step';
import { ReviewStep } from './steps/review-step';
import type { PendingPhoto, PendingRecording } from './types';

export function MobileWizardPage() {
  const { hiveId } = useParams<{ hiveId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('inspection');

  const { data: hive, isLoading: isHiveLoading } = useHive(hiveId ?? '', {
    enabled: !!hiveId,
  });

  const isSubjective = (hive?.inspectionType ?? 'data_driven') === 'subjective';

  // Capacity for the frame counters — sum of maxFrameCount across brood boxes.
  // Used only in data-driven mode.
  const broodFrameCapacity = useMemo(() => {
    if (!hive?.boxes?.length) return null;
    return (
      hive.boxes
        .filter(b => b.type === 'BROOD')
        .reduce((sum, b) => sum + (b.maxFrameCount ?? 0), 0) || null
    );
  }, [hive]);

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(isSubjective ? subjectiveInspectionSchema : inspectionSchema),
    defaultValues: {
      hiveId,
      date: new Date(),
      isAllDay: false,
      observations: {},
      actions: [],
    },
  });

  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [pendingRecordings, setPendingRecordings] = useState<PendingRecording[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  const upsert = useUpsertInspection(undefined, {
    onBeforeNavigate: async (id: string) => {
      await Promise.all([
        pendingRecordings.length > 0
          ? uploadPendingRecordings(id, pendingRecordings)
          : Promise.resolve(),
        pendingPhotos.length > 0
          ? uploadPendingPhotos(id, pendingPhotos)
          : Promise.resolve(),
      ]);
    },
  });

  const steps = useMemo(
    () => [
      {
        key: 'vitals',
        title: t('inspection:mobile.vitals.title'),
        node: (
          <VitalsStep
            isSubjective={isSubjective}
            broodFrameCapacity={broodFrameCapacity}
          />
        ),
      },
      {
        key: 'stores',
        title: t('inspection:mobile.stores.title'),
        node: (
          <StoresStep
            isSubjective={isSubjective}
            broodFrameCapacity={broodFrameCapacity}
          />
        ),
      },
      {
        key: 'queen',
        title: t('inspection:mobile.queen.title'),
        node: <QueenStep />,
      },
      {
        key: 'mediaNotes',
        title: t('inspection:mobile.mediaNotes.title'),
        node: (
          <MediaNotesStep
            pendingPhotos={pendingPhotos}
            onPendingPhotosChange={setPendingPhotos}
            pendingRecordings={pendingRecordings}
            onPendingRecordingsChange={setPendingRecordings}
          />
        ),
      },
      {
        key: 'review',
        title: t('inspection:mobile.review.title'),
        node: (
          <ReviewStep
            isSubjective={isSubjective}
            pendingPhotos={pendingPhotos}
            pendingRecordings={pendingRecordings}
          />
        ),
      },
    ],
    [
      t,
      isSubjective,
      broodFrameCapacity,
      pendingPhotos,
      pendingRecordings,
    ],
  );

  const isLastStep = stepIndex === steps.length - 1;

  const handleSave = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) {
      toast.error(t('inspection:mobile.review.invalid'));
      return;
    }
    const data = form.getValues();
    await upsert(data, InspectionStatus.COMPLETED);
  }, [form, upsert, t]);

  const handleNext = () => {
    if (isLastStep) {
      void handleSave();
    } else {
      setStepIndex(i => i + 1);
    }
  };

  const handleBack = () => {
    setStepIndex(i => Math.max(0, i - 1));
  };

  const handleClose = () => {
    if (hiveId) {
      navigate(`/hives/${hiveId}`);
    } else {
      navigate('/inspections');
    }
  };

  if (isHiveLoading || !hive) {
    return (
      <div className="flex h-dvh w-dvw items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const current = steps[stepIndex];

  return (
    <FormProvider {...form}>
      <WizardShell
        title={hive.name}
        subtitle={current.title}
        stepIndex={stepIndex}
        stepCount={steps.length}
        onBack={handleBack}
        onNext={handleNext}
        onJumpTo={setStepIndex}
        onClose={handleClose}
        nextLabel={
          isLastStep
            ? form.formState.isSubmitting
              ? t('inspection:form.saving')
              : t('inspection:mobile.review.save')
            : undefined
        }
        nextDisabled={isLastStep && form.formState.isSubmitting}
        hideBack={stepIndex === 0}
      >
        {current.node}
      </WizardShell>
    </FormProvider>
  );
}
