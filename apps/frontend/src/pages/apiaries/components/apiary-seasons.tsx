import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  DEFAULT_FEEDING_SEASON,
  seasonListSchema,
  type ApiaryResponse,
  type Season,
} from 'shared-schemas';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { SeasonListField } from '@/components/seasons/season-list-field';
import { useApplyApiarySeasons, useUpdateApiary } from '@/api/hooks';

const apiarySeasonsFormSchema = z.object({
  seasons: seasonListSchema,
});

type ApiarySeasonsFormData = z.infer<typeof apiarySeasonsFormSchema>;

const defaultTemplate = (): Season => ({
  ...DEFAULT_FEEDING_SEASON,
  start: { ...DEFAULT_FEEDING_SEASON.start },
  end: { ...DEFAULT_FEEDING_SEASON.end },
  feeding: { ...DEFAULT_FEEDING_SEASON.feeding },
});

/**
 * Seasons currently stored on the apiary. `undefined` means no template has
 * ever been saved, so the editor starts from the historical default season;
 * an explicit empty list stays empty.
 */
const templateSeasons = (apiary: ApiaryResponse): Season[] => {
  if (apiary.settings?.seasons !== undefined) {
    // Clone: the form must never mutate the cached apiary settings.
    return apiary.settings.seasons.map(season => ({
      ...season,
      start: { ...season.start },
      end: { ...season.end },
      feeding: { ...season.feeding },
    }));
  }
  return [defaultTemplate()];
};

interface ApiarySeasonsProps {
  apiary: ApiaryResponse;
}

/** Owner-only editor for the apiary's shared season template. */
export function ApiarySeasons({ apiary }: ApiarySeasonsProps) {
  const { t } = useTranslation(['apiary', 'common']);
  const [confirmApply, setConfirmApply] = useState(false);
  const { mutate: updateApiary, isPending: isSaving } = useUpdateApiary();
  const { mutate: applySeasons, isPending: isApplying } =
    useApplyApiarySeasons();

  const form = useForm<
    z.input<typeof apiarySeasonsFormSchema>,
    unknown,
    ApiarySeasonsFormData
  >({
    resolver: zodResolver(apiarySeasonsFormSchema),
    defaultValues: { seasons: templateSeasons(apiary) },
  });

  useEffect(() => {
    form.reset({ seasons: templateSeasons(apiary) }, { keepDirtyValues: true });
  }, [apiary, form]);

  const savedSeasons = apiary.settings?.seasons ?? [];
  const canApply = savedSeasons.length > 0 && !form.formState.isDirty;

  const onSubmit = (data: ApiarySeasonsFormData) => {
    updateApiary(
      {
        id: apiary.id,
        data: {
          settings: {
            ...(apiary.settings ?? {}),
            inspectionType: apiary.settings?.inspectionType ?? 'data_driven',
            seasons: data.seasons,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success(t('apiary:seasons.saveSuccess'));
        },
        onError: () => {
          toast.error(t('apiary:seasons.saveError'));
        },
      },
    );
  };

  const onInvalid = () => {
    toast.error(t('apiary:seasons.validationError'));
  };

  const handleApply = () => {
    applySeasons(apiary.id, {
      onSuccess: ({ updated }) => {
        setConfirmApply(false);
        toast.success(t('apiary:seasons.applySuccess', { count: updated }));
      },
      onError: () => {
        toast.error(t('apiary:seasons.applyError'));
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('apiary:seasons.title')}</CardTitle>
          <CardDescription>{t('apiary:seasons.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onInvalid)}
              className="space-y-6"
            >
              <SeasonListField />
              {(form.watch('seasons') ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('apiary:seasons.emptyNotice')}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canApply || isApplying}
                  onClick={() => setConfirmApply(true)}
                  title={
                    form.formState.isDirty
                      ? t('apiary:seasons.saveFirst')
                      : undefined
                  }
                >
                  {t('apiary:seasons.applyToAll')}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? t('apiary:seasons.saving')
                    : t('apiary:seasons.save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={confirmApply}
        onOpenChange={setConfirmApply}
        onConfirm={handleApply}
        isPending={isApplying}
        title={t('apiary:seasons.applyConfirmTitle')}
        description={t('apiary:seasons.applyConfirmDescription')}
        confirmLabel={t('apiary:seasons.applyConfirm')}
        pendingLabel={t('apiary:seasons.applying')}
      />
    </div>
  );
}
