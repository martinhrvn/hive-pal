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

import { Separator } from '@/components/ui/separator';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  MenuItemButton,
} from '@/components/sidebar';

interface InspectionDetailSidebarProps {
  inspectionId: string;
  hiveId: string;
}

export const InspectionDetailSidebar: React.FC<
  InspectionDetailSidebarProps
> = ({ inspectionId, hiveId }) => {
  const navigate = useNavigate();

  return (
    <ActionSidebarContainer>
      <ActionSidebarGroup title="Inspection Actions">
        <MenuItemButton
          icon={<Pencil className="h-4 w-4" />}
          label="Edit Inspection"
          onClick={() => navigate(`/inspections/${inspectionId}/edit`)}
          tooltip="Edit Inspection"
        />
        <MenuItemButton
          icon={<Printer className="h-4 w-4" />}
          label="Print Details"
          onClick={() => window.print()}
          tooltip="Print Inspection"
        />
        <MenuItemButton
          icon={<Trash className="h-4 w-4" />}
          label="Delete Inspection"
          tooltip="Delete Inspection"
          className="text-red-600 hover:text-red-700"
        />
      </ActionSidebarGroup>

      <Separator className="my-2" />

      <ActionSidebarGroup title="Related Actions">
        <MenuItemButton
          icon={<Home className="h-4 w-4" />}
          label="View Hive"
          onClick={() => navigate(`/hives/${hiveId}`)}
          tooltip="Go to Hive"
        />
        <MenuItemButton
          icon={<PlusCircle className="h-4 w-4" />}
          label="New Inspection"
          onClick={() => navigate(`/hives/${hiveId}/inspections/create`)}
          tooltip="Create New Inspection"
        />
      </ActionSidebarGroup>

      <Separator className="my-2" />

      <ActionSidebarGroup title="Navigation">
        <MenuItemButton
          icon={<ClipboardList className="h-4 w-4" />}
          label="All Inspections"
          onClick={() => navigate('/inspections')}
          tooltip="All Inspections"
        />
        <MenuItemButton
          icon={<CalendarRange className="h-4 w-4" />}
          label="Recent Inspections"
          onClick={() => navigate('/inspections/list/recent')}
          tooltip="Recent Inspections"
        />
        <MenuItemButton
          icon={<ArrowLeft className="h-4 w-4" />}
          label="Go Back"
          onClick={() => navigate(-1)}
          tooltip="Go Back"
        />
      </ActionSidebarGroup>
    </ActionSidebarContainer>
  );
};
