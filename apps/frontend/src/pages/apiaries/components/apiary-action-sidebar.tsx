import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, FileDown, Printer, Share2 } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface ApiaryActionSidebarProps {
  onRefreshData?: () => void;
}

export const ApiaryActionSidebar: React.FC<ApiaryActionSidebarProps> = ({
  onRefreshData,
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
                onClick={() => navigate('/apiaries/create/')}
                tooltip="Create New Apiary"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create New Apiary</span>
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
                tooltip="Print Apiary List"
              >
                <Printer className="h-4 w-4" />
                <span>Print Apiary List</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => alert('Share functionality coming soon')}
                tooltip="Share Apiary List"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Apiary List</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </div>
  );
};