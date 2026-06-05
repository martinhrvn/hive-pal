import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FrameCounterProps {
  value: number | null | undefined;
  onChange: (value: number) => void;
  max?: number;
  label?: string;
}

export function FrameCounter({ value, onChange, max, label }: FrameCounterProps) {
  const current = value ?? 0;
  const ceiling = max ?? 99;
  const dec = () => onChange(Math.max(0, current - 1));
  const inc = () => onChange(Math.min(ceiling, current + 1));
  const atFloor = current <= 0;
  const atCeiling = current >= ceiling;

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {max != null && (
            <span className="font-overline text-muted-foreground">
              max {max}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-1.5">
        <button
          type="button"
          onClick={dec}
          disabled={atFloor}
          className={cn(
            'flex size-12 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-all active:scale-[0.94] disabled:opacity-30',
            !atFloor && 'hover:border-foreground/20',
          )}
          aria-label="Decrease"
        >
          <Minus className="size-5" />
        </button>
        <div className="font-display flex-1 text-center text-4xl tabular-nums">
          {current}
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={atCeiling}
          className={cn(
            'flex size-12 items-center justify-center rounded-xl border border-transparent bg-foreground text-background transition-all active:scale-[0.94] disabled:opacity-30',
            !atCeiling && 'hover:bg-foreground/90',
          )}
          aria-label="Increase"
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  );
}
