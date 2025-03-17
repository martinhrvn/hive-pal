import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  RefreshCw,
  FileDown,
  Printer,
  Share2,
  CalendarClockIcon,
  HistoryIcon,
  ClipboardCheckIcon,
} from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface InspectionActionSidebarProps {
  onRefreshData?: () => void;
  selectedHiveId?: string;
  onChangeView: (view: string) => void;
  currentView: string;
}

export const InspectionActionSidebar: React.FC<
  InspectionActionSidebarProps
> = ({ onRefreshData, selectedHiveId, onChangeView, currentView }) => {
  const navigate = useNavigate();

  const handleCreateInspection = () => {
    navigate(
      selectedHiveId && selectedHiveId !== 'all'
        ? `/hives/${selectedHiveId}/inspections/create`
        : '/inspections/create',
    );
  };

  return (
    <div className="border rounded-md">
      <div className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleCreateInspection}
                tooltip="Create New Inspection"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Inspection</span>
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
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onChangeView('all')}
                tooltip="All Inspections"
                className={currentView === 'all' ? 'bg-accent' : ''}
              >
                <ClipboardCheckIcon className="h-4 w-4" />
                <span>All Inspections</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onChangeView('recent')}
                tooltip="Recent Inspections"
                className={currentView === 'recent' ? 'bg-accent' : ''}
              >
                <HistoryIcon className="h-4 w-4" />
                <span>Recent Inspections</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onChangeView('upcoming')}
                tooltip="Upcoming Inspections"
                className={currentView === 'upcoming' ? 'bg-accent' : ''}
              >
                <CalendarClockIcon className="h-4 w-4" />
                <span>Upcoming Inspections</span>
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
                tooltip="Print Inspection List"
              >
                <Printer className="h-4 w-4" />
                <span>Print List</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => alert('Share functionality coming soon')}
                tooltip="Share Inspection List"
              >
                <Share2 className="h-4 w-4" />
                <span>Share List</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </div>
  );
};
