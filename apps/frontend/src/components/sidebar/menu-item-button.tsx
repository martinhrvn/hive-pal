import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

const menuItemClassName = cn(
  'group/menu-item relative flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground/80 transition-[color,background-color,transform]',
  'hover:bg-accent hover:text-foreground active:scale-[0.99]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:opacity-50 disabled:pointer-events-none',
  'data-[active=true]:bg-honey-muted data-[active=true]:text-foreground data-[active=true]:font-medium',
  'data-[active=true]:shadow-[inset_2px_0_0_0_var(--color-honey)]',
);

const MenuItemContent: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <>
    <span
      className={cn(
        'flex items-center justify-center text-muted-foreground transition-colors',
        'group-hover/menu-item:text-honey-foreground group-data-[active=true]/menu-item:text-honey-foreground',
        '[&>svg]:size-4 [&>svg]:shrink-0',
      )}
    >
      {icon}
    </span>
    <span className="truncate flex-1 text-left">{label}</span>
  </>
);

interface MenuItemButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  /** Extra hint shown on hover; omit when it would just repeat the label. */
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
 * For navigation use MenuItemLink, so items keep link semantics.
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
    className={cn(menuItemClassName, className)}
  >
    <MenuItemContent icon={icon} label={label} />
  </button>
);

type MenuItemLinkProps = Pick<LinkProps, 'to'> & {
  icon: React.ReactNode;
  label: string;
  className?: string;
  isActive?: boolean;
};

/** Navigation row in the action sidebar, rendered as a real link. */
export const MenuItemLink: React.FC<MenuItemLinkProps> = ({
  to,
  icon,
  label,
  className,
  isActive,
}) => (
  <Link
    to={to}
    data-active={isActive || undefined}
    aria-current={isActive ? 'page' : undefined}
    className={cn(menuItemClassName, className)}
  >
    <MenuItemContent icon={icon} label={label} />
  </Link>
);
