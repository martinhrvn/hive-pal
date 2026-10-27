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

/**
 * Defaults for a new hive. Seasons are intentionally absent: a hive inherits
 * its apiary's season template (or the built-in default feeding season) until
 * it is customised on the Settings tab.
 */
export const defaultHiveSettings = {
  inspection: {
    frequencyDays: 7,
    calendarEnabled: true,
  },
};

type NumberInputFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
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
