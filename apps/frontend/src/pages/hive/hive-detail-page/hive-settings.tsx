import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateHive } from '@/api/hooks';
import { toast } from 'sonner';
import type { HiveDetailResponse } from 'shared-schemas';

const hiveSettingsSchema = z.object({
  settings: z.object({
    autumnFeeding: z.object({
      startMonth: z.number().int().min(1).max(12),
      endMonth: z.number().int().min(1).max(12),
      amountKg: z.number().positive(),
    }),
    inspection: z.object({
      frequencyDays: z.number().int().positive(),
    }),
  }),
});

type HiveSettingsFormData = z.infer<typeof hiveSettingsSchema>;

interface HiveSettingsProps {
  hive: HiveDetailResponse | undefined;
  onHiveUpdated: () => void;
}

export const HiveSettings: React.FC<HiveSettingsProps> = ({ hive, onHiveUpdated }) => {
  const { mutate: updateHive, isPending } = useUpdateHive();

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Default settings
  const defaultSettings = {
    autumnFeeding: {
      startMonth: 8,
      endMonth: 10,
      amountKg: 12,
    },
    inspection: {
      frequencyDays: 7,
    },
  };

  const form = useForm<HiveSettingsFormData>({
    resolver: zodResolver(hiveSettingsSchema),
    defaultValues: {
      settings: hive?.settings || defaultSettings,
    },
  });

  const onSubmit = (data: HiveSettingsFormData) => {
    if (!hive?.id) return;

    updateHive(
      {
        id: hive.id,
        data: {
          settings: data.settings,
        },
      },
      {
        onSuccess: () => {
          toast.success('Hive settings updated successfully');
          onHiveUpdated();
        },
        onError: (error) => {
          toast.error('Failed to update hive settings');
          console.error('Update hive settings error:', error);
        },
      }
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
            Configure feeding schedules and inspection frequencies specific to this hive.
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
                    Define the autumn feeding window and target amount for this hive.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="settings.autumnFeeding.startMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Month</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthOptions.map(month => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          When to begin autumn feeding
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.autumnFeeding.endMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Month</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthOptions.map(month => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          When to end autumn feeding
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.autumnFeeding.amountKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Amount (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="12"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Target feeding amount in sugar equivalent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
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
                  <FormField
                    control={form.control}
                    name="settings.inspection.frequencyDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inspection Frequency (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            placeholder="7"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value) || 7)}
                          />
                        </FormControl>
                        <FormDescription>
                          How often to inspect this hive (in days)
                        </FormDescription>
                        <FormMessage />
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