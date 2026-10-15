import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Editorial header card used at the top of detail pages (hive, queen):
 * rounded-xl shell with a warm shadow, an overline with a honey dot, a
 * display title and hairline-separated strips.
 *
 * The shell is a `@container/editorial`, so children can respond to the
 * card's width with `@sm/editorial:` etc.
 */
export const EditorialCard = ({
  className,
  children,
  ...props
}: ComponentProps<'section'>) => (
  <div className="@container/editorial">
    <section
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border bg-card',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(120,80,20,0.08)]',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  </div>
);

/** Column next to an optional media block; holds the header and strips. */
export const EditorialCardBody = ({ children }: { children: ReactNode }) => (
  <div className="flex min-w-0 flex-1 flex-col">{children}</div>
);

/** Top block: overline row, title and any lead text. */
export const EditorialCardHeader = ({ children }: { children: ReactNode }) => (
  <div className="min-w-0 px-4 py-4 @sm/editorial:px-5 @lg/editorial:px-6">
    {children}
  </div>
);

/** Honey dot + small-caps label on the left, `trailing` (status, icons) right. */
export const EditorialCardOverline = ({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2 pt-0.5">
      <span
        className="inline-flex size-1.5 shrink-0 rounded-full bg-honey ring-[3px] ring-honey/20"
        aria-hidden
      />
      <span className="truncate font-overline text-muted-foreground">
        {children}
      </span>
    </div>
    {trailing && (
      <div className="flex shrink-0 items-center gap-2">{trailing}</div>
    )}
  </div>
);

export const EditorialCardTitle = ({
  className,
  ...props
}: ComponentProps<'h1'>) => (
  <h1
    className={cn(
      'mt-1.5 break-words font-display text-2xl font-medium leading-[1.05] text-foreground @sm/editorial:text-3xl @lg/editorial:text-4xl',
      className,
    )}
    {...props}
  />
);

/**
 * Hairline-separated band below the header. `muted` is the washed footer
 * band that sits at the bottom of the card.
 */
export const EditorialCardStrip = ({
  muted = false,
  className,
  ...props
}: ComponentProps<'div'> & { muted?: boolean }) => (
  <div
    className={cn(
      'border-t px-4 @sm/editorial:px-5 @lg/editorial:px-6',
      muted ? 'mt-auto bg-muted/50 py-3' : 'py-4',
      className,
    )}
    {...props}
  />
);
