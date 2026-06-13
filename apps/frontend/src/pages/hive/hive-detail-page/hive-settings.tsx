import { useForm } from 'react-hook-form';
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
          toast.success('Hive settings updated successfully');
          onHiveUpdated();
        },
        onError: error => {
          toast.error('Failed to update hive settings');
          console.error('Update hive settings error:', error);
        },
      },
    );
  };

  if (!hive) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hive Settings</CardTitle>
          <CardDescription>
            Configure feeding schedules and inspection frequencies specific to
            this hive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Autumn Feeding Settings */}
              <div className="space-y-4">
                <div className="pb-2 border-b">
                  <h3 className="text-lg font-medium">Autumn Feeding</h3>
                  <p className="text-sm text-muted-foreground">
                    Define the autumn feeding window and target amount for this
                    hive.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MonthSelectField
                    control={form.control}
                    name="settings.autumnFeeding.startMonth"
                    label="Start Month"
                    description="When to begin autumn feeding"
                  />

                  <MonthSelectField
                    control={form.control}
                    name="settings.autumnFeeding.endMonth"
                    label="End Month"
                    description="When to end autumn feeding"
                  />

                  <NumberInputField
                    control={form.control}
                    name="settings.autumnFeeding.amountKg"
                    label="Target Amount (kg)"
                    step="0.1"
                    min={0}
                    placeholder="12"
                    description="Target feeding amount in sugar equivalent"
                  />
                </div>
              </div>

              {/* Inspection Settings */}
              <div className="space-y-4">
                <div className="pb-2 border-b">
                  <h3 className="text-lg font-medium">Inspection Schedule</h3>
                  <p className="text-sm text-muted-foreground">
                    Set the preferred inspection frequency for this hive.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberInputField
                    control={form.control}
                    name="settings.inspection.frequencyDays"
                    label="Inspection Frequency (days)"
                    min={1}
                    max={365}
                    placeholder="7"
                    fallback={7}
                    description="How often to inspect this hive (in days)"
                  />

                  <FormField
                    control={form.control}
                    name="settings.inspection.calendarEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Show in calendar</FormLabel>
                          <FormDescription>
                            Include scheduled inspections in the calendar feed
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
                  {isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
