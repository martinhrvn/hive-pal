import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  DEFAULT_FEEDING_SEASON,
  seasonListSchema,
  yearRoundScheduleSchema,
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
import { NumberField } from '@/components/common/number-field';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { SeasonsEditorProvider } from '@/components/seasons/season-editor-provider';
import { SeasonListField } from '@/components/seasons/season-list-field';
import { SeasonYearStrip } from '@/components/seasons/season-year-strip';
import { useApplyApiarySeasons, useUpdateApiary } from '@/api/hooks';
import { sortSeasonsByStart } from '@/utils/season-strip';

const apiarySeasonsFormSchema = z.object({
  seasons: seasonListSchema,
  yearRound: yearRoundScheduleSchema,
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
    // Clone: the form must never mutate the cached apiary settings. Saved
    // seasons list in calendar order.
    return sortSeasonsByStart(apiary.settings.seasons).map(season => ({
      ...season,
      start: { ...season.start },
      end: { ...season.end },
      feeding: { ...season.feeding },
    }));
  }
  return [defaultTemplate()];
};

const formValues = (apiary: ApiaryResponse) => ({
  seasons: templateSeasons(apiary),
  yearRound: {
    inspectionFrequencyDays:
      apiary.settings?.yearRound?.inspectionFrequencyDays ?? null,
  },
});

interface ApiarySeasonsProps {
  apiary: ApiaryResponse;
}

/** Owner-only editor for the apiary's shared season template. */
export function ApiarySeasons({ apiary }: Readonly<ApiarySeasonsProps>) {
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
    defaultValues: formValues(apiary),
  });

  useEffect(() => {
    form.reset(formValues(apiary), { keepDirtyValues: true });
  }, [apiary, form]);

  const savedSeasons = apiary.settings?.seasons ?? [];
  const canApply = savedSeasons.length > 0 && !form.formState.isDirty;
  const watchedSeasons = useWatch({ control: form.control, name: 'seasons' });
  const watchedYearRoundDays = useWatch({
    control: form.control,
    name: 'yearRound.inspectionFrequencyDays',
  });

  const onSubmit = (data: ApiarySeasonsFormData) => {
    const seasons = sortSeasonsByStart(data.seasons);
    updateApiary(
      {
        id: apiary.id,
        data: {
          settings: {
            seasons,
            yearRound: {
              inspectionFrequencyDays:
                data.yearRound.inspectionFrequencyDays ?? null,
            },
          },
        },
      },
      {
        onSuccess: () => {
          // Saved values, in calendar order, become the new baseline.
          form.reset({ ...data, seasons });
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
          <CardTitle>{t('apiary:seasons.scheduleTitle')}</CardTitle>
          <CardDescription>{t('apiary:seasons.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <SeasonsEditorProvider>
              <form
                onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                className="space-y-6"
              >
                <SeasonYearStrip
                  seasons={(watchedSeasons ?? []) as Season[]}
                  baseFrequencyDays={watchedYearRoundDays ?? undefined}
                />

                <section className="space-y-3">
                  <h3 className="border-b pb-2 text-lg font-medium">
                    {t('common:season.title')}
                  </h3>
                  <SeasonListField
                    baseFrequencyDays={watchedYearRoundDays ?? undefined}
                  />
                  {(watchedSeasons ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t('apiary:seasons.emptyNotice')}
                    </p>
                  )}
                </section>

                <section className="space-y-3">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">
                      {t('apiary:seasons.yearRound.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('apiary:seasons.yearRound.description')}
                    </p>
                  </div>
                  <div className="max-w-xs">
                    <NumberField
                      control={form.control}
                      name="yearRound.inspectionFrequencyDays"
                      label={t('apiary:seasons.yearRound.inspectionInterval')}
                      description={t(
                        'apiary:seasons.yearRound.inspectionIntervalHint',
                      )}
                      placeholder={t(
                        'apiary:seasons.yearRound.inspectionIntervalPlaceholder',
                      )}
                      min={1}
                      max={365}
                      nullable
                    />
                  </div>
                </section>

                <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2 rounded-lg border bg-card/95 p-2 shadow-sm backdrop-blur">
                  {form.formState.isDirty && (
                    <span className="mr-auto text-sm text-muted-foreground">
                      {t('common:unsavedChanges')}
                    </span>
                  )}
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
            </SeasonsEditorProvider>
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
