import type { StripRole } from '@/utils/season-strip';

/**
 * Colour by what a season does, shared by the year strip, its key and the
 * season rows. `swatch` is a small piece of the strip, so a row's marker
 * matches its segment.
 */
export const ROLE_TONES: Record<
  StripRole,
  { segment: string; swatch: string; tick: string }
> = {
  feeding: {
    segment: 'bg-honey-muted',
    swatch: 'border border-honey bg-honey-muted',
    tick: 'stroke-honey',
  },
  paused: {
    segment: 'bg-hatch',
    swatch: 'border border-muted-foreground/40 bg-hatch',
    tick: '',
  },
  inspect: {
    segment: 'bg-success-muted',
    swatch: 'border border-success bg-success-muted',
    tick: 'stroke-success',
  },
  yearRound: {
    segment: 'bg-background',
    swatch: 'border bg-background',
    tick: 'stroke-muted-foreground/60',
  },
};
