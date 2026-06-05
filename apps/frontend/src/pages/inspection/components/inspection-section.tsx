import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type InspectionSectionProps = {
  title: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Editorial section wrapper used throughout the inspection detail page.
 * Simple title + hairline rule on the warm stone palette.
 */
export const InspectionSection = ({
  title,
  icon,
  trailing,
  children,
  className,
}: InspectionSectionProps) => {
  return (
    <section
      className={cn(
        '@container/sec relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-card',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(120,80,20,0.08)]',
        className,
      )}
    >
      <header className="relative flex items-end justify-between gap-4 px-5 @lg/sec:px-7 pt-5 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <span className="text-stone-400 dark:text-stone-500 shrink-0">
              {icon}
            </span>
          )}
          <h2 className="font-display text-xl @sm/sec:text-2xl leading-tight text-stone-900 dark:text-stone-50 truncate">
            {title}
          </h2>
        </div>
        {trailing && <div className="shrink-0 pb-1">{trailing}</div>}
      </header>
      <div className="border-t border-stone-200 dark:border-stone-800 mx-5 @lg/sec:mx-7" />
      <div className="px-5 @lg/sec:px-7 py-5 @sm/sec:py-6">{children}</div>
      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-amber-500/[0.04] pointer-events-none"
        aria-hidden
      />
    </section>
  );
};
