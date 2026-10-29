import { cn } from '@/lib/utils';
import type { StripRole } from '@/utils/season-strip';
import { ROLE_TONES } from './season-tone';

/** A small square of a role's strip colour: the strip key and season rows. */
export function SeasonSwatch({
  role,
  className,
}: Readonly<{ role: StripRole; className?: string }>) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-3 shrink-0 rounded-xs',
        ROLE_TONES[role].swatch,
        className,
      )}
    />
  );
}
