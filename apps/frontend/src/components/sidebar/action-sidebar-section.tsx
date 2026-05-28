import React from 'react';
import { cn } from '@/lib/utils';

interface ActionSidebarContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Outer wrapper for the right-side action sidebar. Provides the editorial
 * card shell that matches the apiary header and hive cards: rounded-xl,
 * hairline border, soft warm shadow.
 */
export const ActionSidebarContainer: React.FC<ActionSidebarContainerProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'rounded-xl border border-stone-200/80 dark:border-stone-800 bg-card overflow-hidden',
      'shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_22px_-14px_rgba(120,80,20,0.08)]',
      className,
    )}
  >
    {children}
  </div>
);

interface ActionSidebarGroupProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Section inside the action sidebar. Renders an uppercase overline title
 * and auto-divides from previous siblings with a hairline border so callers
 * no longer need explicit `mt-4` or `<Separator/>` spacing.
 */
export const ActionSidebarGroup: React.FC<ActionSidebarGroupProps> = ({
  title,
  children,
  className,
}) => (
  <section
    className={cn(
      'px-3 py-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-stone-200/70 dark:[&:not(:first-child)]:border-stone-800',
      className,
    )}
  >
    {title && (
      <h3 className="font-overline text-stone-500 dark:text-stone-400 mb-1.5 px-2">
        {title}
      </h3>
    )}
    <div className="flex flex-col gap-0.5">{children}</div>
  </section>
);

// Legacy alias used by a handful of places; identical to ActionSidebarGroup
// but accepts the same props as the original ActionSidebarSection.
interface ActionSidebarSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  withBorder?: boolean;
  withPadding?: boolean;
}

export const ActionSidebarSection: React.FC<ActionSidebarSectionProps> = ({
  title,
  children,
  className,
}) => (
  <ActionSidebarGroup title={title} className={className}>
    {children}
  </ActionSidebarGroup>
);
