import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  QUEEN_COLORS,
  QUEEN_STATUSES,
  getQueenColorClass,
  getQueenColorForYear,
  queenStatusLabelKey,
} from '@/lib/queen-utils';
import { cn } from '@/lib/utils';
import { FormSection } from './form-section';
import { TextField } from './text-field';
import type { QueenFormValues } from './queen-form-schema';

export const QueenFields = () => {
  const { t } = useTranslation('queen');
  const { control, getValues, setValue } = useFormContext<QueenFormValues>();

  // Pre-fill the international marking colour, never overriding a choice
  const suggestColor = (year: number | null) => {
    const color = getQueenColorForYear(year);
    if (color && !getValues('color')) setValue('color', color);
  };

  return (
    <FormSection title={t('sections.queen')}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          name="name"
          label={t('fields.name')}
          placeholder={t('form.enterName')}
        />
        <FormField
          control={control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.year')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={t('form.enterYear')}
                  {...field}
                  value={field.value ?? ''}
                  onChange={e =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  onBlur={() => {
                    field.onBlur();
                    suggestColor(field.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.color')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.selectColor')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {QUEEN_COLORS.map(color => (
                    <SelectItem key={color} value={color}>
                      <span
                        className={cn(
                          'size-4 rounded-full border border-border',
                          getQueenColorClass(color),
                        )}
                      />
                      {t(`colors.${color}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <TextField
          name="marking"
          label={t('fields.marking')}
          placeholder={t('form.enterMarking')}
        />
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.status')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.selectStatus')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {QUEEN_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {t(queenStatusLabelKey(status))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  );
};
