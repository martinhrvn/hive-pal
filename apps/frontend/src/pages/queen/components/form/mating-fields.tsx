import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { queenMatingTypeSchema } from 'shared-schemas';
import { DatePickerPopover } from '@/components/common/date-picker-popover';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormSection } from './form-section';
import { TextField } from './text-field';
import type { QueenFormValues } from './queen-form-schema';

const NOT_SET = 'none';

export const MatingFields = () => {
  const { t } = useTranslation('queen');
  const { control } = useFormContext<QueenFormValues>();
  const matingType = useWatch({ control, name: 'matingType' });

  return (
    <FormSection title={t('sections.mating')}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="matingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.matingType')}</FormLabel>
              <Select
                value={field.value ?? NOT_SET}
                onValueChange={value =>
                  field.onChange(
                    value === NOT_SET
                      ? null
                      : queenMatingTypeSchema.parse(value),
                  )
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.selectMatingType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NOT_SET}>{t('form.notSet')}</SelectItem>
                  {queenMatingTypeSchema.options.map(type => (
                    <SelectItem key={type} value={type}>
                      {t(`matingType.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="matedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.matedAt')}</FormLabel>
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
        {matingType === 'MATING_STATION' && (
          <TextField
            name="matingStation"
            label={t('fields.matingStation')}
            placeholder={t('form.enterMatingStation')}
          />
        )}
      </div>
    </FormSection>
  );
};
