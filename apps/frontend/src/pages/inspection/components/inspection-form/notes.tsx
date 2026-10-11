import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { InspectionFormData } from './schema';
import { AiBadge } from './ai-badge';
import { AiSectionPreview } from './ai-section-preview';
import type { AiMergeState } from '@/pages/inspection/lib/inspection-ai-merge';
import { cn } from '@/lib/utils';
import { shouldUseAiPrefill } from '@/pages/inspection/lib/inspection-ai-merge';

type NotesSectionProps = {
  isAiSuggested?: (field: keyof InspectionFormData) => boolean;
  aiMergeState?: AiMergeState | null;
  onAcceptSuggestion?: (field: keyof InspectionFormData) => void;
  onDismissSuggestion?: (field: keyof InspectionFormData) => void;
};

function getSuggestedNotesValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function NotesSection({
  isAiSuggested,
  aiMergeState,
  onAcceptSuggestion,
  onDismissSuggestion,
}: NotesSectionProps) {
  const { t } = useTranslation('inspection');
  const form = useFormContext<InspectionFormData>();

  const notesSuggestion = isAiSuggested?.('notes')
    ? aiMergeState?.suggestions.notes
    : undefined;

  const isPending = notesSuggestion?.status === 'pending';
  const isDirty = Boolean(form.formState.dirtyFields.notes);
  const suggestedNotesValue = getSuggestedNotesValue(notesSuggestion?.aiValue);

  return (
    <div
      className={cn(
        'space-y-4 rounded-md p-3 transition-colors',
        isPending &&
          'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
      )}
      data-ai-field="notes"
    >
      <h2 className="text-lg font-medium">
        {t('inspection:form.notes.title')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t('inspection:form.notes.description')}
      </p>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => {
          const shouldPrefill =
            Boolean(notesSuggestion) &&
            shouldUseAiPrefill(field.value, isDirty, notesSuggestion);

          const displayValue = shouldPrefill
            ? (suggestedNotesValue ?? '')
            : (field.value ?? '');

          return (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <span>Notes</span>
                {notesSuggestion && <AiBadge />}
              </FormLabel>

              <FormControl>
                <Textarea
                  placeholder={t('inspection:form.notes.placeholder')}
                  className={cn(
                    'min-h-[120px]',
                    isPending &&
                      'border-blue-200 bg-blue-50/20 dark:border-blue-900 dark:bg-blue-950/10',
                  )}
                  {...field}
                  value={displayValue}
                />
              </FormControl>

              {notesSuggestion && (
                <AiSectionPreview
                  title="Notes"
                  summary="Review AI-generated notes before applying them."
                  currentValue={field.value}
                  suggestedValue={suggestedNotesValue}
                  hasConflict={notesSuggestion.hasConflict}
                  status={notesSuggestion.status}
                  onAccept={() => onAcceptSuggestion?.('notes')}
                  onDismiss={() => onDismissSuggestion?.('notes')}
                />
              )}

              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
}
