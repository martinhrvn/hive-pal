import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { QueenDetail } from 'shared-schemas';
import { useCreateQueen, useQueenHistory, useUpdateQueen } from '@/api/hooks';
import { QueenNotFound } from '../queen-not-found';
import { DatesFields } from './dates-fields';
import { FixedHiveFields, HivePickerFields } from './hive-fields';
import { MatingFields } from './mating-fields';
import { NotesField } from './notes-field';
import { OriginFields } from './origin-fields';
import { QueenFields } from './queen-fields';
import { QueenFormFrame, QueenFormSkeleton } from './queen-form-frame';
import {
  createQueenFormSchema,
  getQueenFormDefaults,
  toQueenPayload,
  type QueenFormValues,
} from './queen-form-schema';
import { TraitsFields } from './traits-fields';

/**
 * `/queens/create`, or `/hives/:hiveId/queens/create` with the hive fixed.
 * `?motherQueenId=` pre-selects the mother ("Add daughter").
 */
export const CreateQueenForm = () => {
  const { t } = useTranslation('queen');
  const navigate = useNavigate();
  const { hiveId: routeHiveId } = useParams();
  const [searchParams] = useSearchParams();
  const { mutateAsync: createQueen } = useCreateQueen();

  const schema = useMemo(
    () => createQueenFormSchema(t, { requireHive: true }),
    [t],
  );
  const form = useForm<QueenFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getQueenFormDefaults({
      hiveId: routeHiveId,
      motherQueenId: searchParams.get('motherQueenId') ?? undefined,
    }),
  });

  const onSubmit = async (values: QueenFormValues) => {
    try {
      const queen = await createQueen({
        ...toQueenPayload(values),
        hiveId: values.hiveId,
      });
      toast.success(t('create.success'));
      navigate(routeHiveId ? `/hives/${routeHiveId}` : `/queens/${queen.id}`);
    } catch {
      toast.error(t('create.error'));
    }
  };

  return (
    <QueenFormFrame
      title={t('create.title')}
      form={form}
      onSubmit={onSubmit}
      submitLabel={t('create.button')}
      submitEvent="Queen Create"
      cancelTo={routeHiveId ? `/hives/${routeHiveId}` : '/queens'}
    >
      <QueenFields />
      {routeHiveId ? (
        <FixedHiveFields hiveId={routeHiveId} />
      ) : (
        <HivePickerFields />
      )}
      <OriginFields />
      <MatingFields />
      <DatesFields />
      <TraitsFields />
      <NotesField />
    </QueenFormFrame>
  );
};

const EditQueenFormBody = ({ queen }: { queen: QueenDetail }) => {
  const { t } = useTranslation('queen');
  const navigate = useNavigate();
  const { mutateAsync: updateQueen } = useUpdateQueen();

  const schema = useMemo(
    () => createQueenFormSchema(t, { requireHive: false }),
    [t],
  );
  // Mounted only once the queen has loaded, so defaults are the real values
  const form = useForm<QueenFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getQueenFormDefaults({ queen }),
  });

  const onSubmit = async (values: QueenFormValues) => {
    try {
      // No hiveId: moving a queen goes through a transfer, which records it
      await updateQueen({ id: queen.id, data: toQueenPayload(values) });
      toast.success(t('edit.success'));
      navigate(`/queens/${queen.id}`);
    } catch {
      toast.error(t('edit.error'));
    }
  };

  return (
    <QueenFormFrame
      title={t('edit.title')}
      form={form}
      onSubmit={onSubmit}
      submitLabel={t('edit.button')}
      submitEvent="Queen Edit"
      cancelTo={`/queens/${queen.id}`}
    >
      <QueenFields />
      <FixedHiveFields hiveName={queen.hiveName} hint={t('form.hiveLocked')} />
      <OriginFields queenId={queen.id} currentMother={queen.motherQueen} />
      <MatingFields />
      <DatesFields />
      <TraitsFields />
      <NotesField />
    </QueenFormFrame>
  );
};

/** `/queens/:queenId/edit` */
export const EditQueenForm = ({ queenId }: { queenId: string }) => {
  const { data: queen, isPending, isError } = useQueenHistory(queenId);

  if (isPending) return <QueenFormSkeleton />;
  if (isError) return <QueenNotFound />;
  return <EditQueenFormBody queen={queen} />;
};
