import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EditIcon, Icon, PlusCircle, TrashIcon, RefreshCw, CalendarPlus } from 'lucide-react';
import { bee } from '@lucide/lab';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { WeatherForecast } from '@/components/weather';
import { AlertItem } from '@/components/alerts';
import { useHive } from '@/api/hooks';
import { QRCodeDialog } from './qr-code-dialog';

type ActionSideBarProps = {
  hiveId?: string;
  onRefreshData?: () => void;
};

export const ActionSideBar: React.FC<ActionSideBarProps> = ({
  hiveId,
  onRefreshData,
}) => {
  const navigate = useNavigate();
  const { data: hive } = useHive(hiveId || '', { enabled: !!hiveId });

  return (
    <div className="space-y-4">
      {/* Alerts Section */}
      {hive?.alerts && hive.alerts.length > 0 && (
        <div className="border rounded-md">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 pt-2">Active Alerts</SidebarGroupLabel>
            <div className="px-2 pb-2 space-y-1 max-h-64 overflow-y-auto">
              {hive.alerts.map((alert) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  showActions={true}
                />
              ))}
            </div>
          </SidebarGroup>
        </div>
      )}
      
      {hive?.apiaryId && (
        <div className="border rounded-md">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 pt-2">Weather Forecast</SidebarGroupLabel>
            <WeatherForecast apiaryId={hive.apiaryId} compact />
          </SidebarGroup>
        </div>
      )}
      
      <div className="border rounded-md">
        <div className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Hive Actions</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() =>
                  hiveId && navigate(`/hives/${hiveId}/inspections/create`)
                }
                tooltip="Add Inspection"
                disabled={!hiveId}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Inspection</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate(`/inspections/schedule`)}
                tooltip="Schedule Inspection"
              >
                <CalendarPlus className="h-4 w-4" />
                <span>Schedule Inspection</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() =>
                  hiveId && navigate(`/hives/${hiveId}/queens/create`)
                }
                tooltip="Add Queen"
                disabled={!hiveId}
              >
                <Icon iconNode={bee} className="h-4 w-4" />
                <span>Add Queen</span>
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
          <SidebarGroupLabel>Manage Hive</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => hiveId && navigate(`/hives/${hiveId}/edit`)}
                tooltip="Edit Hive"
                disabled={!hiveId}
              >
                <EditIcon className="h-4 w-4" />
                <span>Edit Hive</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              {hiveId && hive ? (
                <QRCodeDialog hiveId={hiveId} hiveName={hive.name} />
              ) : (
                <SidebarMenuButton disabled tooltip="QR Code">
                  <span>QR Code</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => alert('Remove functionality coming soon')}
                tooltip="Remove Hive"
                disabled={!hiveId}
              >
                <TrashIcon className="h-4 w-4" />
                <span>Remove Hive</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
      </div>
    </div>
  );
};
