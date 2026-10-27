import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import {
  getApiaryYearRoundFrequencyDays,
  getEffectiveSeasons,
  isHiveOwnedSeasonSource,
  seasonListSchema,
  type ApiarySeasonSettings,
  type HiveDetailResponse,
  type HiveSeasonSettings,
  type Season,
  type SeasonSource,
} from 'shared-schemas';
import { useUpdateHive } from '@/api/hooks';
import { NumberField } from '@/components/common/number-field';
import { SeasonListField } from '@/components/seasons/season-list-field';
import { SeasonSummaryList } from '@/components/seasons/season-summary-list';
import { SeasonYearStrip } from '@/components/seasons/season-year-strip';

const DEFAULT_INSPECTION = { frequencyDays: 7, calendarEnabled: true };

const hiveSettingsFormSchema = z.object({
  seasons: seasonListSchema,
  inspection: z.object({
    frequencyDays: z.number().int().positive().max(365),
    calendarEnabled: z.boolean(),
  }),
});

type HiveSettingsFormData = z.infer<typeof hiveSettingsFormSchema>;

interface HiveSettingsProps {
  hive: HiveDetailResponse | undefined;
  onHiveUpdated: () => void;
}

const cloneSeasons = (seasons: Season[]): Season[] =>
  seasons.map(season => ({
    ...season,
    start: { ...season.start },
    end: { ...season.end },
    feeding: { ...season.feeding },
  }));

/**
 * Seasons currently governing the hive, plus where they come from. `source`
 * distinguishes a hive-owned list (including the legacy autumn window) from
 * seasons inherited from the apiary template or the built-in default.
 */
const resolveSeasons = (hive?: HiveDetailResponse) =>
  getEffectiveSeasons(
    hive?.settings as HiveSeasonSettings | undefined,
    hive?.apiarySettings as ApiarySeasonSettings | undefined,
  );

const buildFormValues = (hive?: HiveDetailResponse): HiveSettingsFormData => {
  const effective = resolveSeasons(hive);
  return {
    seasons: cloneSeasons(effective.seasons),
    inspection: {
      frequencyDays:
        hive?.settings?.inspection?.frequencyDays ??
        DEFAULT_INSPECTION.frequencyDays,
      calendarEnabled:
        hive?.settings?.inspection?.calendarEnabled ??
        DEFAULT_INSPECTION.calendarEnabled,
    },
  };
};

export const HiveSettings: React.FC<HiveSettingsProps> = ({
  hive,
  onHiveUpdated,
}) => {
  const { t } = useTranslation(['hive', 'common']);
  const { mutate: updateHive, isPending } = useUpdateHive();

  const initialValues = useMemo(() => buildFormValues(hive), [hive]);
  const initialSource = useMemo(() => resolveSeasons(hive).source, [hive]);
  // Seasons a hive without its own list would inherit: the apiary template,
  // or the built-in default when the apiary has no template.
  const inherited = useMemo(
    () =>
      getEffectiveSeasons(
        null,
        hive?.apiarySettings as ApiarySeasonSettings | undefined,
      ),
    [hive?.apiarySettings],
  );

  // Set when the apiary has a year-round interval: hives that inherit the
  // apiary schedule use it instead of their own.
  const apiaryYearRoundDays = getApiaryYearRoundFrequencyDays(
    hive?.apiarySettings as ApiarySeasonSettings | undefined,
  );

  const [isCustom, setIsCustom] = useState(
    isHiveOwnedSeasonSource(initialSource),
  );

  const form = useForm<
    z.input<typeof hiveSettingsFormSchema>,
    unknown,
    HiveSettingsFormData
  >({
    resolver: zodResolver(hiveSettingsFormSchema),
    defaultValues: initialValues,
  });

  // The tab can mount before the hive query resolves; seed the form once the
  // hive arrives. Later refetches keep the user's edits.
  useEffect(() => {
    if (!hive) return;
    form.reset(buildFormValues(hive));
    setIsCustom(isHiveOwnedSeasonSource(resolveSeasons(hive).source));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hive?.id]);

  const customSource: SeasonSource =
    initialSource === 'legacy' ? 'legacy' : 'hive';
  const source: SeasonSource = isCustom ? customSource : inherited.source;

  const formSeasons = useWatch({ control: form.control, name: 'seasons' });
  const formFrequencyDays = useWatch({
    control: form.control,
    name: 'inspection.frequencyDays',
  });
  const inheritsYearRound = !isCustom && apiaryYearRoundDays != null;
  // What the strip shows: the schedule this hive will follow once saved.
  const stripSeasons = isCustom
    ? ((formSeasons ?? []) as Season[])
    : inherited.seasons;
  const stripBaseDays = inheritsYearRound
    ? apiaryYearRoundDays
    : formFrequencyDays;

  const onSubmit = (data: HiveSettingsFormData) => {
    if (!hive?.id) return;

    // Preserve unknown settings keys, but replace the season source when the
    // user chose to inherit (dropping both hive seasons and the legacy field).
    const baseSettings = { ...(hive.settings ?? {}) };
    delete baseSettings.seasons;
    delete baseSettings.autumnFeeding;

    updateHive(
      {
        id: hive.id,
        data: {
          id: hive.id,
          settings: {
            ...baseSettings,
            inspection: data.inspection,
            ...(isCustom ? { seasons: data.seasons } : {}),
          },
        },
        apiaryId: hive.apiaryId,
      },
      {
        onSuccess: () => {
          // Saved values become the new baseline: edited seasons collapse
          // back into summary rows.
          form.reset(data);
          toast.success(t('hive:settings.updateSuccess'));
          onHiveUpdated();
        },
        onError: error => {
          toast.error(t('hive:settings.updateError'));
          console.error('Update hive settings error:', error);
        },
      },
    );
  };

  const onInvalid = () => {
    toast.error(t('hive:settings.validationError'));
  };

  const useApiarySeasons = () => {
    form.setValue('seasons', cloneSeasons(inherited.seasons), {
      shouldDirty: true,
      shouldValidate: true,
    });
    // Back to inheriting: the hive's own stored interval is the fallback
    // again, so undo the copy taken when customising.
    form.setValue(
      'inspection.frequencyDays',
      initialValues.inspection.frequencyDays,
      { shouldDirty: true },
    );
    setIsCustom(false);
  };

  // Seasons and the year-round interval are one schedule: customising copies
  // both, so the hive starts from exactly what it followed before.
  const customiseSchedule = () => {
    if (apiaryYearRoundDays != null) {
      form.setValue('inspection.frequencyDays', apiaryYearRoundDays, {
        shouldDirty: true,
      });
    }
    setIsCustom(true);
  };

  if (!hive) {
    return <div>{t('common:status.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('hive:settings.title')}</CardTitle>
          <CardDescription>{t('hive:settings.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onInvalid)}
              className="space-y-6"
            >
              <SeasonYearStrip
                seasons={stripSeasons}
                baseFrequencyDays={stripBaseDays}
              />

              {/* Seasons */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 border-b pb-2">
                  <h3 className="text-lg font-medium">
                    {t('common:season.title')}
                  </h3>
                  <Badge variant="secondary">
                    {t(`common:season.source.${source}`)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isCustom
                    ? t('common:season.customHint')
                    : t('common:season.inheritedHint')}
                </p>

                {source === 'legacy' && isCustom && (
                  <p className="text-sm text-muted-foreground">
                    {t('hive:settings.legacySeasonsHint')}
                  </p>
                )}

                {isCustom ? (
                  <>
                    <SeasonListField
                      baseFrequencyDays={form.watch('inspection.frequencyDays')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={useApiarySeasons}
                    >
                      {t('common:season.useApiarySeasons')}
                    </Button>
                  </>
                ) : (
                  <>
                    <SeasonSummaryList
                      seasons={inherited.seasons}
                      source={inherited.source}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={customiseSchedule}
                    >
                      {t('common:season.customise')}
                    </Button>
                  </>
                )}
              </div>

              {/* Inspection Settings */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-medium">
                    {t('hive:settings.inspectionSchedule')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('hive:settings.inspectionScheduleDescription')}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {inheritsYearRound ? (
                    <div
                      className="space-y-1 rounded-lg border p-4"
                      data-test="inherited-year-round"
                    >
                      <p className="text-sm font-medium">
                        {t('hive:settings.inspectionFrequency')}
                      </p>
                      <p className="text-sm">
                        {t('common:season.inspectionEvery', {
                          days: apiaryYearRoundDays,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('hive:settings.inspectionFrequencyInherited')}
                      </p>
                    </div>
                  ) : (
                    <NumberField
                      control={form.control}
                      name="inspection.frequencyDays"
                      label={t('hive:settings.inspectionFrequency')}
                      min={1}
                      max={365}
                      placeholder="7"
                      fallback={7}
                      description={t(
                        'hive:settings.inspectionFrequencyDescription',
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="inspection.calendarEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>
                            {t('hive:settings.showInCalendar')}
                          </FormLabel>
                          <FormDescription>
                            {t('hive:settings.showInCalendarDescription')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? t('hive:settings.saving')
                    : t('hive:settings.save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
