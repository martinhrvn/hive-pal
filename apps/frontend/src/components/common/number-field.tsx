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

type NumberFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
  disabled?: boolean;
  /** Value used when a non-nullable field is cleared or unparseable. */
  fallback?: number;
  /** When true, an empty input becomes `null` instead of `fallback`. */
  nullable?: boolean;
};

/**
 * A numeric input bound to a numeric form field. Non-nullable fields (the
 * default) fall back to `fallback` when cleared; `nullable` fields map an
 * empty input to `null` (used by optional season values).
 */
export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  min,
  max,
  step,
  disabled,
  fallback = 0,
  nullable = false,
}: NumberFieldProps<T>) {
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
              disabled={disabled}
              value={(field.value as number | null | undefined) ?? ''}
              onChange={event => {
                const raw = event.target.value;
                if (raw === '') {
                  field.onChange(nullable ? null : fallback);
                } else if (nullable) {
                  field.onChange(event.target.valueAsNumber);
                } else {
                  field.onChange(Number(raw) || fallback);
                }
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
