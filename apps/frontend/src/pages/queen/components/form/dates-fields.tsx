import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { DatePickerPopover } from '@/components/common/date-picker-popover';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormSection } from './form-section';
import type { QueenFormValues } from './queen-form-schema';

export const DatesFields = () => {
  const { t } = useTranslation('queen');
  const { control } = useFormContext<QueenFormValues>();

  return (
    <FormSection title={t('sections.dates')}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="installedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.installationDate')}</FormLabel>
              <FormControl>
                <DatePickerPopover
                  date={field.value}
                  // Required: ignore deselecting the current day
                  onDateChange={date => date && field.onChange(date)}
                  placeholder={t('form.pickDate')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="replacedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.replacedDate')}</FormLabel>
              <FormControl>
                <DatePickerPopover
                  date={field.value ?? undefined}
                  onDateChange={date => field.onChange(date ?? null)}
                  placeholder={t('form.pickDate')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  );
};
