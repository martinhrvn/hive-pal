import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  RefreshCw, 
  FileDown, 
  Printer, 
  Share2
} from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

interface HiveActionSidebarProps {
  onRefreshData?: () => void;
}

export const HiveActionSidebar: React.FC<HiveActionSidebarProps> = ({ 
  onRefreshData 
}) => {
  const navigate = useNavigate();

  return (
    <div className="border rounded-md">
      <div className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/hives/create/')}
                tooltip="Create New Hive"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create New Hive</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onRefreshData && onRefreshData()}
                tooltip="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Data</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Data Options</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => alert('Export functionality coming soon')}
                tooltip="Export to CSV"
              >
                <FileDown className="h-4 w-4" />
                <span>Export to CSV</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => window.print()}
                tooltip="Print Hive List"
              >
                <Printer className="h-4 w-4" />
                <span>Print Hive List</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => alert('Share functionality coming soon')}
                tooltip="Share Hive List"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Hive List</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </div>
  );
};