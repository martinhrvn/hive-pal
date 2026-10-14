import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { QueenFormValues } from './queen-form-schema';

type TextFieldName = {
  [K in keyof QueenFormValues]: QueenFormValues[K] extends string ? K : never;
}[keyof QueenFormValues];

export const TextField = ({
  name,
  label,
  placeholder,
}: {
  name: TextFieldName;
  label: string;
  placeholder?: string;
}) => {
  const { control } = useFormContext<QueenFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
