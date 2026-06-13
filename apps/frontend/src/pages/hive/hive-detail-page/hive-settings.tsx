import { useForm } from 'react-hook-form';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUpdateHive } from '@/api/hooks';
import { toast } from 'sonner';
import type { HiveDetailResponse } from 'shared-schemas';
import {
  MonthSelectField,
  NumberInputField,
  defaultHiveSettings,
} from '../components/hive-settings-fields';

const hiveSettingsSchema = z.object({
  settings: z.object({
    autumnFeeding: z.object({
      startMonth: z.number().int().min(1).max(12),
      endMonth: z.number().int().min(1).max(12),
      amountKg: z.number().positive(),
    }),
    inspection: z.object({
      frequencyDays: z.number().int().positive(),
      calendarEnabled: z.boolean().default(true),
    }),
  }),
});

type HiveSettingsFormData = z.infer<typeof hiveSettingsSchema>;

interface HiveSettingsProps {
  hive: HiveDetailResponse | undefined;
  onHiveUpdated: () => void;
}

export const HiveSettings: React.FC<HiveSettingsProps> = ({
  hive,
  onHiveUpdated,
}) => {
  const { t } = useTranslation(['hive', 'common']);
  const { mutate: updateHive, isPending } = useUpdateHive();

  const form = useForm<HiveSettingsFormData>({
    resolver: zodResolver(hiveSettingsSchema),
    defaultValues: {
      settings: hive?.settings || defaultHiveSettings,
    },
  });

  const onSubmit = (data: HiveSettingsFormData) => {
    if (!hive?.id) return;

    updateHive(
      {
        id: hive.id,
        data: {
          id: hive.id,
          settings: data.settings,
        },
      },
      {
        onSuccess: () => {
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Autumn Feeding Settings */}
              <div className="space-y-4">
                <div className="pb-2 border-b">
                  <h3 className="text-lg font-medium">
                    {t('hive:settings.autumnFeeding')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('hive:settings.autumnFeedingDescription')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MonthSelectField
                    control={form.control}
                    name="settings.autumnFeeding.startMonth"
                    label={t('hive:settings.startMonth')}
                    description={t('hive:settings.startMonthDescription')}
                  />

                  <MonthSelectField
                    control={form.control}
                    name="settings.autumnFeeding.endMonth"
                    label={t('hive:settings.endMonth')}
                    description={t('hive:settings.endMonthDescription')}
                  />

                  <NumberInputField
                    control={form.control}
                    name="settings.autumnFeeding.amountKg"
                    label={t('hive:settings.targetAmount')}
                    step="0.1"
                    min={0}
                    placeholder="12"
                    description={t('hive:settings.targetAmountDescription')}
                  />
                </div>
              </div>

              {/* Inspection Settings */}
              <div className="space-y-4">
                <div className="pb-2 border-b">
                  <h3 className="text-lg font-medium">
                    {t('hive:settings.inspectionSchedule')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('hive:settings.inspectionScheduleDescription')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberInputField
                    control={form.control}
                    name="settings.inspection.frequencyDays"
                    label={t('hive:settings.inspectionFrequency')}
                    min={1}
                    max={365}
                    placeholder="7"
                    fallback={7}
                    description={t('hive:settings.inspectionFrequencyDescription')}
                  />

                  <FormField
                    control={form.control}
                    name="settings.inspection.calendarEnabled"
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
