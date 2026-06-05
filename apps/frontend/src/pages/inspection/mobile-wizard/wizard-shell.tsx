import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WizardShellProps {
  title: string;
  subtitle?: string;
  stepIndex: number;
  stepCount: number;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  onJumpTo: (index: number) => void;
  onClose: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideBack?: boolean;
}

export function WizardShell({
  title,
  subtitle,
  stepIndex,
  stepCount,
  children,
  onBack,
  onNext,
  onJumpTo,
  onClose,
  nextLabel,
  nextDisabled,
  hideBack,
}: WizardShellProps) {
  return (
    <div className="relative flex h-dvh w-dvw flex-col overflow-hidden bg-background">
      {/* Ambient backdrop — a single warm wash so the screen doesn't feel
          clinical. Sits behind everything, never interacts with content. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-[oklch(0.96_0.04_85)] to-transparent dark:from-[oklch(0.22_0.04_85)] dark:to-transparent"
      />

      {/* Header */}
      <div className="px-5 pt-[max(env(safe-area-inset-top),0.875rem)] pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-overline text-muted-foreground">
              {subtitle ?? 'Inspection'}
            </div>
            <div className="font-display mt-0.5 truncate text-xl leading-tight">
              {title}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground backdrop-blur-sm">
              {stepIndex + 1}/{stepCount}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
              className="size-9 rounded-full text-muted-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Segmented progress — replaces the dots. Each segment maps to a step
            and is tappable, so the dots' jump-to behavior is preserved. */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: stepCount }).map((_, i) => {
            const state =
              i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'todo';
            return (
              <button
                key={i}
                type="button"
                onClick={() => onJumpTo(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  state === 'active' &&
                    'bg-[oklch(0.75_0.16_82)] dark:bg-[oklch(0.78_0.16_82)]',
                  state === 'done' && 'bg-foreground/70',
                  state === 'todo' && 'bg-border',
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex flex-1 flex-col overflow-hidden px-5 pt-2 pb-3">
        {children}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-border/60 bg-background/80 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),0.875rem)] backdrop-blur-md">
        <div className="flex gap-2">
          {!hideBack && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="h-14 flex-1 rounded-2xl text-base"
            >
              <ArrowLeft className="mr-1.5 size-4" />
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={cn(
              'group h-14 rounded-2xl text-base shadow-sm shadow-foreground/10 transition-transform active:scale-[0.98]',
              hideBack ? 'w-full' : 'flex-[2]',
            )}
          >
            {nextLabel ?? 'Continue'}
            {!nextLabel && (
              <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
