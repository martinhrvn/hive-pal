import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { DatePickerPopover } from '@/components/common/date-picker-popover';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormSection } from './form-section';
import type { QueenFormValues } from './queen-form-schema';

type OptionalDateName = 'cellCappedAt' | 'emergedAt' | 'replacedAt';

/** A date that can be left empty, or cleared by deselecting it. */
const OptionalDateField = ({
  name,
  label,
  description,
}: {
  name: OptionalDateName;
  label: string;
  description?: string;
}) => {
  const { t } = useTranslation('queen');
  const { control } = useFormContext<QueenFormValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <DatePickerPopover
              date={field.value ?? undefined}
              onDateChange={date => field.onChange(date ?? null)}
              placeholder={t('form.pickDate')}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const DatesFields = () => {
  const { t } = useTranslation('queen');
  const { control } = useFormContext<QueenFormValues>();

  return (
    <FormSection title={t('sections.dates')}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <OptionalDateField
          name="cellCappedAt"
          label={t('fields.cellCappedAt')}
          description={t('form.estimateHint')}
        />
        <OptionalDateField
          name="emergedAt"
          label={t('fields.emergedAt')}
          description={t('form.estimateHint')}
        />
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
        <OptionalDateField name="replacedAt" label={t('fields.replacedDate')} />
      </div>
    </FormSection>
  );
};
