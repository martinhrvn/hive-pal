import { Control, FieldPath, FieldValues } from 'react-hook-form';
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

export const monthOptions = [
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
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(month => (
                  <SelectItem
                    key={month.value}
                    value={month.value.toString()}
                  >
                    {month.label}
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
