import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TapScaleProps {
  // Stored value in 0-10 range (schema units). Null/undefined means "not set".
  value: number | null | undefined;
  onChange: (value: number) => void;
  // Optional label rendered above the scale.
  label?: string;
}

// Five anchor presets spread across the 0-10 observation scale, flanked by
// step buttons so any in-between value stays reachable with a thumb. The active
// anchor (when the value lands exactly on one) uses a warm amber wash so the
// user's last choice stays visible at a glance; unselected buttons sit in a
// softer neutral so they feel inviting but secondary. Values are stored in the
// same 0-10 units as the desktop slider, so the two views never disagree.
const ANCHORS = [0, 2, 5, 7, 10];

export function TapScale({ value, onChange, label }: TapScaleProps) {
  const current = value == null ? 0 : value;

  const step = (delta: number) => {
    const next = Math.min(10, Math.max(0, current + delta));
    onChange(next);
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="font-overline text-muted-foreground">
            {value == null ? '— / 10' : `${value} / 10`}
          </span>
        </div>
      )}
      <div className="flex items-stretch gap-1.5">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={current <= 0}
          aria-label="Decrease"
          className="font-display flex h-14 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all duration-150 hover:border-foreground/20 hover:text-foreground active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40"
        >
          <Minus className="h-5 w-5" />
        </button>
        <div className="grid flex-1 grid-cols-5 gap-1.5">
          {ANCHORS.map(n => {
            const isSelected = value === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
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
        <button
          type="button"
          onClick={() => step(1)}
          disabled={current >= 10}
          aria-label="Increase"
          className="font-display flex h-14 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all duration-150 hover:border-foreground/20 hover:text-foreground active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
