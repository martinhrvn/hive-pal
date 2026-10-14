import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from './form-section';
import type { QueenFormValues } from './queen-form-schema';

export const NotesField = () => {
  const { t } = useTranslation('queen');
  const { control } = useFormContext<QueenFormValues>();

  return (
    <FormSection title={t('sections.notes')}>
      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">{t('fields.notes')}</FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder={t('form.enterNotes')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
};
