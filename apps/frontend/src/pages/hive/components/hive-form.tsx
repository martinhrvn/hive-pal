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
  FormMessage,
} from '@/components/ui/form';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils.ts';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { useApiary } from '@/hooks/use-apiary';
import React, { useEffect } from 'react';
import { useCreateHive } from '@/api/hooks';
import type { HiveStatus as HiveStatusEnum } from 'shared-schemas';

const hiveSchema = z.object({
  name: z.string(),
  notes: z.string().optional(),
  apiaryId: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  installationDate: z.date(),
});

export type HiveFormData = z.infer<typeof hiveSchema>;

type HiveFormProps = {
  onSubmit?: (data: HiveFormData) => void;
  isLoading?: boolean;
};

export const HiveForm: React.FC<HiveFormProps> = ({
  onSubmit: onSubmitOverride,
  isLoading,
}) => {
  const { t } = useTranslation(['hive', 'common']);
  const navigate = useNavigate();
  const { apiaries, activeApiaryId } = useApiary();
  const { mutate } = useCreateHive({
    onSuccess: () => navigate('/'),
  });
  const apiaryOptions = apiaries?.map(apiary => ({
    value: apiary.id,
    label: `${apiary.name}${apiary.location ? ` (${apiary.location})` : ''}`,
  }));

  const form = useForm<HiveFormData>({
    resolver: zodResolver(hiveSchema),
    defaultValues: {
      apiaryId: activeApiaryId ?? undefined,
    },
  });

  const onSubmit = (data: HiveFormData) => {
    if (onSubmitOverride) {
      return onSubmitOverride(data);
    } else {
      mutate({
        ...data,
        status: data.status as HiveStatusEnum,
        installationDate: data.installationDate.toISOString(),
      });
    }
  };

  useEffect(() => {
    if (activeApiaryId) {
      form.setValue('apiaryId', activeApiaryId);
    }
  }, [activeApiaryId, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('hive:fields.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('hive:form.hivePlaceholder')} {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="apiaryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('hive:fields.apiary')}</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={activeApiaryId ?? field.value}
                >
                  <SelectTrigger className={'w-full'}>
                    <SelectValue placeholder={t('hive:form.selectHive')} />
                  </SelectTrigger>
                  <SelectContent>
                    {apiaryOptions?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('hive:fields.notes')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('hive:form.notesPlaceholder')} {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="installationDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('hive:fields.installationDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>{t('hive:form.pickDate')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={date =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={isLoading} type="submit">
          {t('hive:form.submit')}
        </Button>
      </form>
    </Form>
  );
};
