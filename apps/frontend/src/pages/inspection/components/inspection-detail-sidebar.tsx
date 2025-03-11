import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Pencil,
  Trash,
  ArrowLeft,
  Home,
  ClipboardList,
  CalendarRange,
  Printer,
} from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface InspectionDetailSidebarProps {
  inspectionId: string;
  hiveId: string;
}

export const InspectionDetailSidebar: React.FC<
  InspectionDetailSidebarProps
> = ({ inspectionId, hiveId }) => {
  const navigate = useNavigate();

  return (
    <div className="border rounded-md">
      <div className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Inspection Actions</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate(`/inspections/${inspectionId}/edit`)}
                tooltip="Edit Inspection"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit Inspection</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => window.print()}
                tooltip="Print Inspection"
              >
                <Printer className="h-4 w-4" />
                <span>Print Details</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Delete Inspection"
                className="text-red-600 hover:text-red-700"
              >
                <Trash className="h-4 w-4" />
                <span>Delete Inspection</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Related Actions</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate(`/hives/${hiveId}`)}
                tooltip="Go to Hive"
              >
                <Home className="h-4 w-4" />
                <span>View Hive</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate(`/hives/${hiveId}/inspections/create`)}
                tooltip="Create New Inspection"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Inspection</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/inspections')}
                tooltip="All Inspections"
              >
                <ClipboardList className="h-4 w-4" />
                <span>All Inspections</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/inspections/list/recent')}
                tooltip="Recent Inspections"
              >
                <CalendarRange className="h-4 w-4" />
                <span>Recent Inspections</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate(-1)} tooltip="Go Back">
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </div>
  );
};
