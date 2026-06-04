import { FileText, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InspectionSection } from './inspection-section';

type NotesCardProps = {
  notes?: string | null;
};

export const NotesCard = ({ notes }: NotesCardProps) => {
  const { t } = useTranslation('inspection');
  if (!notes) return null;

  return (
    <InspectionSection
      title={t('notesCard.title', { defaultValue: 'Notes' })}
      icon={<FileText className="h-4 w-4" />}
    >
      <figure className="relative pl-7 pr-2 py-1">
        <Quote
          className="absolute left-0 top-1 h-4 w-4 text-amber-500/70 dark:text-amber-400/60"
          aria-hidden
        />
        <blockquote className="font-display text-lg leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
          {notes}
        </blockquote>
      </figure>
    </InspectionSection>
  );
};
