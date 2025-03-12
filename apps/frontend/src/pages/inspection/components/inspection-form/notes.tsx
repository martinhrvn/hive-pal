import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { InspectionFormData } from './schema';

export const NotesSection = () => {
  const form = useFormContext<InspectionFormData>();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Notes</h2>
      <p className="text-sm text-muted-foreground">
        Add any additional notes about this inspection
      </p>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter any observations, findings, or actions taken during the inspection..."
                className="min-h-[120px]"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
