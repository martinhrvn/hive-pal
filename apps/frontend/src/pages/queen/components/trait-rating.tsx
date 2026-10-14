import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SCALE = [1, 2, 3, 4, 5] as const;

type RatingInputProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
};

/** 1–5 segmented rating; "not rated" is a valid state, so it can be cleared. */
export const RatingInput = ({ label, value, onChange }: RatingInputProps) => {
  const { t } = useTranslation('queen');
  const labelId = useId();

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div role="group" aria-labelledby={labelId} className="flex gap-1">
          {SCALE.map(step => (
            <button
              key={step}
              type="button"
              aria-pressed={value === step}
              aria-label={t('traits.rate', { trait: label, value: step })}
              onClick={() => onChange(step)}
              className={cn(
                'size-8 rounded-md border text-sm font-medium tabular-nums transition-[color,background-color,transform] active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                value != null && step <= value
                  ? 'border-honey bg-honey-muted text-honey-foreground'
                  : 'border-input text-muted-foreground hover:bg-accent',
              )}
            >
              {step}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          aria-label={t('traits.clearLabel', { trait: label })}
          // Keep the layout stable when there is nothing to clear
          className={cn(value == null && 'invisible')}
        >
          {t('traits.clear')}
        </Button>
      </div>
    </div>
  );
};

/** Read-only 1–5 meter for the detail page. */
export const RatingMeter = ({ value }: { value: number }) => {
  const { t } = useTranslation('queen');
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1" aria-hidden>
        {SCALE.map(step => (
          <span
            key={step}
            className={cn(
              'h-2 w-5 rounded-full',
              step <= value ? 'bg-honey' : 'bg-muted',
            )}
          />
        ))}
      </div>
      <span className="text-sm tabular-nums text-muted-foreground">
        {t('traits.value', { value })}
      </span>
    </div>
  );
};
