import React from 'react';
import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';

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
  withBorder = false,
  withPadding = false,
}) => (
  <div className={cn(withBorder && 'border rounded-md', className)}>
    <div className={cn(withPadding && 'p-2')}>
      <SidebarGroup>
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroup>
    </div>
  </div>
);

interface ActionSidebarContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionSidebarContainer: React.FC<ActionSidebarContainerProps> = ({
  children,
  className,
}) => (
  <div className={cn('border rounded-md', className)}>
    <div className="p-2">{children}</div>
  </div>
);

interface ActionSidebarGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ActionSidebarGroup: React.FC<ActionSidebarGroupProps> = ({
  title,
  children,
  className,
}) => (
  <SidebarGroup className={className}>
    <SidebarGroupLabel>{title}</SidebarGroupLabel>
    <SidebarMenu>{children}</SidebarMenu>
  </SidebarGroup>
);
