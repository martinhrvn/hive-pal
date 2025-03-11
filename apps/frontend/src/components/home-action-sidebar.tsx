import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  RefreshCw, 
  ClipboardCheck, 
  CalendarCheck,
  Crown,
  Home,
  Bell
} from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface HomeActionSidebarProps {
  onRefreshData?: () => void;
}

export const HomeActionSidebar: React.FC<HomeActionSidebarProps> = ({ 
  onRefreshData 
}) => {
  const navigate = useNavigate();

  return (
    <div className="border rounded-md">
      <div className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Create New</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/hives/create/')}
                tooltip="Create New Hive"
              >
                <PlusCircle className="h-4 w-4 text-green-600" />
                <span>New Hive</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/inspections/create')}
                tooltip="Create New Inspection"
              >
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                <span>New Inspection</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/queens/create')}
                tooltip="Create New Queen"
              >
                <Crown className="h-4 w-4 text-purple-600" />
                <span>New Queen</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/')}
                tooltip="Home"
                className="bg-accent"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/hives')}
                tooltip="All Hives"
              >
                <Home className="h-4 w-4" />
                <span>All Hives</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/inspections')}
                tooltip="All Inspections"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>All Inspections</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/inspections/list/recent')}
                tooltip="Recent Inspections"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Recent Inspections</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onRefreshData && onRefreshData()}
                tooltip="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Data</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => alert('Notifications feature coming soon')}
                tooltip="Notifications (Coming Soon)"
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </div>
  );
};