import React from 'react';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface MenuItemButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  tooltip?: string;
  className?: string;
  disabled?: boolean;
}

export const MenuItemButton: React.FC<MenuItemButtonProps> = ({
  icon,
  label,
  onClick,
  tooltip,
  className,
  disabled,
}) => (
  <SidebarMenuItem>
    <SidebarMenuButton
      onClick={onClick}
      tooltip={tooltip}
      className={className}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </SidebarMenuButton>
  </SidebarMenuItem>
);
