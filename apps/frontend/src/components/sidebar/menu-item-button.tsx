import React from 'react';
import { cn } from '@/lib/utils';

interface MenuItemButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  tooltip?: string;
  className?: string;
  disabled?: boolean;
  /** Highlights the item as the current view / current page. */
  isActive?: boolean;
}

/**
 * Single action row in the right-side action sidebar. Standalone — does not
 * depend on the left-navigation Sidebar context, so its hover/active states
 * stay consistent regardless of the main sidebar's collapsed state.
 */
export const MenuItemButton: React.FC<MenuItemButtonProps> = ({
  icon,
  label,
  onClick,
  tooltip,
  className,
  disabled,
  isActive,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    data-active={isActive || undefined}
    className={cn(
      'group/menu-item relative flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-stone-700 dark:text-stone-300 transition-colors',
      'hover:bg-stone-100/70 dark:hover:bg-stone-800/40 hover:text-stone-900 dark:hover:text-stone-50',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
      'disabled:opacity-50 disabled:pointer-events-none',
      'data-[active=true]:bg-amber-50/80 dark:data-[active=true]:bg-amber-950/30',
      'data-[active=true]:text-stone-900 dark:data-[active=true]:text-amber-100',
      'data-[active=true]:font-medium',
      'data-[active=true]:shadow-[inset_2px_0_0_0_var(--color-amber-500)]',
      className,
    )}
  >
    <span
      className={cn(
        'flex items-center justify-center text-stone-500 dark:text-stone-400 transition-colors',
        'group-hover/menu-item:text-amber-600 dark:group-hover/menu-item:text-amber-400',
        'group-data-[active=true]/menu-item:text-amber-700 dark:group-data-[active=true]/menu-item:text-amber-400',
        '[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
      )}
    >
      {icon}
    </span>
    <span className="truncate flex-1 text-left">{label}</span>
  </button>
);
