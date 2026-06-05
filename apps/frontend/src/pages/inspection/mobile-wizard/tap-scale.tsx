import { cn } from '@/lib/utils';

interface TapScaleProps {
  // Stored value in 0-10 range (schema units). Null/undefined means "not set".
  value: number | null | undefined;
  onChange: (value: number) => void;
  // Optional label rendered above the scale.
  label?: string;
}

// Six big tap targets (0..5). Stored value is doubled to match the 0..10
// observation schema. The active button uses a warm amber wash so the user's
// last choice stays visible at a glance; unselected buttons sit in a softer
// neutral so they feel inviting but secondary.
export function TapScale({ value, onChange, label }: TapScaleProps) {
  const selected = value == null ? null : Math.round(value / 2);

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="font-overline text-muted-foreground">
            {selected == null ? '— / 5' : `${selected} / 5`}
          </span>
        </div>
      )}
      <div className="grid grid-cols-6 gap-1.5">
        {[0, 1, 2, 3, 4, 5].map(n => {
          const isSelected = selected === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n * 2)}
              className={cn(
                'font-display flex h-14 items-center justify-center rounded-xl border text-xl tabular-nums transition-all duration-150 active:scale-[0.94]',
                isSelected
                  ? 'border-transparent bg-[oklch(0.78_0.16_82)] text-[oklch(0.22_0.04_60)] shadow-sm shadow-[oklch(0.78_0.16_82)]/40 dark:bg-[oklch(0.82_0.16_82)] dark:text-[oklch(0.18_0.02_60)]'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground',
              )}
              aria-pressed={isSelected}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
