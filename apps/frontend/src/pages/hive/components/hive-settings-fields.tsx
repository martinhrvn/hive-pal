import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormDescription,
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
} from '@/components/ui/select.tsx';

const MONTHS = [
  { value: 1, key: 'january' },
  { value: 2, key: 'february' },
  { value: 3, key: 'march' },
  { value: 4, key: 'april' },
  { value: 5, key: 'may' },
  { value: 6, key: 'june' },
  { value: 7, key: 'july' },
  { value: 8, key: 'august' },
  { value: 9, key: 'september' },
  { value: 10, key: 'october' },
  { value: 11, key: 'november' },
  { value: 12, key: 'december' },
] as const;

export const defaultHiveSettings = {
  autumnFeeding: {
    startMonth: 8,
    endMonth: 10,
    amountKg: 12,
  },
  inspection: {
    frequencyDays: 7,
    calendarEnabled: true,
  },
};

type BaseFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
};

/** A month picker bound to a numeric (1-12) form field. */
export function MonthSelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: BaseFieldProps<T>) {
  const { t } = useTranslation('common');
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Select
              onValueChange={value => field.onChange(Number(value))}
              value={field.value?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('months.selectMonth')} />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(month => (
                  <SelectItem
                    key={month.value}
                    value={month.value.toString()}
                  >
                    {t(`months.${month.key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type NumberInputFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
  /** Value used when the input cannot be parsed as a number. */
  fallback?: number;
};

/** A numeric input bound to a numeric form field. */
export function NumberInputField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  min,
  max,
  step,
  fallback = 0,
}: NumberInputFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              min={min}
              max={max}
              placeholder={placeholder}
              {...field}
              onChange={e => field.onChange(Number(e.target.value) || fallback)}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
