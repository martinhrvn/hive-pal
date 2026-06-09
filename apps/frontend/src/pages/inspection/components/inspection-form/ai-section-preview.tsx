import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type Props = {
  title: string;
  summary: string;
  currentValue: React.ReactNode;
  suggestedValue: React.ReactNode;
  hasConflict?: boolean;
  status?: 'pending' | 'accepted' | 'dismissed';
  onAccept: () => void;
  onDismiss: () => void;
};

export function AiSectionPreview({
  title,
  summary,
  currentValue,
  suggestedValue,
  hasConflict = false,
  status = 'pending',
  onAccept,
  onDismiss,
}: Props) {
  const { t } = useTranslation('ai');
  const [open, setOpen] = useState(false);

  if (status !== 'pending') return null;

  return (
    <div className="mt-3 rounded-md border border-muted bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{summary}</div>
          <div className={hasConflict ? 'mt-1 text-xs text-amber-600' : 'mt-1 text-xs text-blue-600'}>
            {hasConflict ? t('preview.conflictNote') : t('preview.contentNote')}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(v => !v)}
        >
          {open ? t('preview.hidePreview') : t('preview.review')}
        </Button>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs text-muted-foreground">{t('preview.current')}</div>
            <div className="min-h-20 rounded border bg-background p-2 text-sm">
              {currentValue || <span className="italic text-muted-foreground">{t('preview.empty')}</span>}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-muted-foreground">{t('preview.ai')}</div>
            <div className="min-h-20 rounded border bg-background p-2 text-sm">
              {suggestedValue || <span className="italic text-muted-foreground">{t('preview.empty')}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onAccept}>
          {t('preview.accept')}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          {t('preview.dismiss')}
        </Button>
      </div>
    </div>
  );
}
