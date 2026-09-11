import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EditIcon,
  Icon,
  PlusCircle,
  TrashIcon,
  CalendarPlus,
  AlertTriangle,
  Smartphone,
  Mic,
  Split,
} from 'lucide-react';
import { bee } from '@lucide/lab';
import { useTranslation } from 'react-i18next';

import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { AlertItem } from '@/components/alerts';
import { useHive, useDeleteHive } from '@/api/hooks';
import { QRCodeDialog } from './qr-code-dialog';
import { LlmPromptDialog } from './llm-prompt-dialog';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  MenuItemButton,
  WeatherForecastSection,
} from '@/components/sidebar';
import { RefreshButton } from '@/components/sidebar/refresh-button';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { SplitWizard } from './split/split-wizard';

type ActionSideBarProps = {
  hiveId?: string;
  onRefreshData?: () => void;
};

export const ActionSideBar: React.FC<ActionSideBarProps> = ({
  hiveId,
  onRefreshData,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation(['hive', 'inspection', 'common']);
  const { canEdit } = useApiaryPermission();
  const { data: hive } = useHive(hiveId || '', { enabled: !!hiveId });
  const deleteHive = useDeleteHive();
  const [splitOpen, setSplitOpen] = useState(false);

  const deleteDialog = useDeleteDialog(
    () => {
      if (!hiveId) throw new Error('Hive ID is required');
      return deleteHive.mutateAsync(hiveId);
    },
    () => navigate(`/apiaries/${hive?.apiaryId}`),
  );

  return (
    <div className="space-y-4">
      {/* Active Alerts */}
      {hive?.alerts && hive.alerts.length > 0 && (
        <ActionSidebarContainer className="border-amber-300/70 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_22px_-14px_rgba(217,119,6,0.20)]">
          <ActionSidebarGroup
            title={
              <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                <span>
                  {t('hive:fields.activeAlerts', {
                    defaultValue: 'Active Alerts',
                  })}
                </span>
                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-amber-500/15 dark:bg-amber-400/20 text-amber-700 dark:text-amber-200 text-[10px] font-semibold tabular-nums px-1.5">
                  {hive.alerts.length}
                </span>
              </span>
            }
          >
            <div className="max-h-64 overflow-y-auto -mx-1 px-1 flex flex-col gap-1">
              {hive.alerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} showActions={true} />
              ))}
            </div>
          </ActionSidebarGroup>
        </ActionSidebarContainer>
      )}

      <WeatherForecastSection apiaryId={hive?.apiaryId} compact />

      <ActionSidebarContainer>
        <ActionSidebarGroup
          title={t('hive:actions.title', { defaultValue: 'Hive Actions' })}
        >
          {canEdit && (
            <MenuItemButton
              icon={<PlusCircle className="h-4 w-4" />}
              label={t('inspection:actions.addInspection', {
                defaultValue: 'Add Inspection',
              })}
              onClick={() =>
                hiveId && navigate(`/hives/${hiveId}/inspections/create`)
              }
              tooltip={t('inspection:actions.addInspection', {
                defaultValue: 'Add Inspection',
              })}
              disabled={!hiveId}
            />
          )}
          {canEdit && (
            <MenuItemButton
              icon={<Smartphone className="h-4 w-4" />}
              label={t('inspection:actions.mobileInspection', {
                defaultValue: 'Mobile Inspection',
              })}
              onClick={() =>
                hiveId && navigate(`/hives/${hiveId}/inspect/mobile`)
              }
              tooltip={t('inspection:actions.mobileInspection', {
                defaultValue: 'Mobile Inspection',
              })}
              disabled={!hiveId}
            />
          )}
          {canEdit && (
            <MenuItemButton
              icon={<Mic className="h-4 w-4" />}
              label={t('inspection:actions.audioInspection', {
                defaultValue: 'Audio Inspection',
              })}
              onClick={() =>
                hiveId && navigate(`/hives/${hiveId}/inspect/audio`)
              }
              tooltip={t('inspection:actions.audioInspection', {
                defaultValue: 'Audio Inspection',
              })}
              disabled={!hiveId}
            />
          )}
          {canEdit && (
            <MenuItemButton
              icon={<CalendarPlus className="h-4 w-4" />}
              label={t('inspection:actions.scheduleInspection', {
                defaultValue: 'Schedule Inspection',
              })}
              onClick={() => navigate(`/inspections/schedule`)}
              tooltip={t('inspection:actions.scheduleInspection', {
                defaultValue: 'Schedule Inspection',
              })}
            />
          )}
          {canEdit && (
            <MenuItemButton
              icon={<Icon iconNode={bee} className="h-4 w-4" />}
              label={t('hive:actions.addQueen', {
                defaultValue: 'Add Queen',
              })}
              onClick={() => hiveId && navigate(`/hives/${hiveId}/queens/create`)}
              tooltip={t('hive:actions.addQueen', {
                defaultValue: 'Add Queen',
              })}
              disabled={!hiveId}
            />
          )}
          {canEdit && (
            <MenuItemButton
              icon={<Split className="h-4 w-4" />}
              label={t('hive:actions.splitColony', {
                defaultValue: 'Split colony',
              })}
              onClick={() => setSplitOpen(true)}
              tooltip={t('hive:actions.splitColony', {
                defaultValue: 'Split colony',
              })}
              disabled={!hive}
            />
          )}
          <RefreshButton
            onRefresh={onRefreshData}
            i18nNamespace="hive"
            label={t('hive:actions.refreshData', {
              defaultValue: 'Refresh Data',
            })}
          />
        </ActionSidebarGroup>

        {canEdit && (
          <ActionSidebarGroup
            title={t('hive:manage.title', { defaultValue: 'Manage Hive' })}
          >
            <MenuItemButton
              icon={<EditIcon className="h-4 w-4" />}
              label={t('hive:edit.title', { defaultValue: 'Edit Hive' })}
              onClick={() => hiveId && navigate(`/hives/${hiveId}/edit`)}
              tooltip={t('hive:edit.title', { defaultValue: 'Edit Hive' })}
              disabled={!hiveId}
            />
            <SidebarMenuItem>
              {hiveId && hive ? (
                <QRCodeDialog hiveId={hiveId} hiveName={hive.name} />
              ) : (
                <SidebarMenuButton
                  disabled
                  tooltip={t('hive:actions.qr', { defaultValue: 'QR Code' })}
                >
                  <span>{t('hive:actions.qr', { defaultValue: 'QR Code' })}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
            <SidebarMenuItem>
              {hiveId && hive ? (
                <LlmPromptDialog hiveId={hiveId} hiveName={hive.name} />
              ) : (
                <SidebarMenuButton
                  disabled
                  tooltip={t('hive:manage.llmPrompt', { defaultValue: 'LLM Prompt', })}
                >
                  <span>
                    {t('hive:manage.llmPrompt', { defaultValue: 'LLM Prompt' })}
                  </span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
            <MenuItemButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={t('hive:manage.removeHive', { defaultValue: 'Remove Hive' })}
              onClick={deleteDialog.open}
              tooltip={t('hive:manage.removeHive', { defaultValue: 'Remove Hive' })}
              disabled={!hiveId}
            />
          </ActionSidebarGroup>
        )}

        <DeleteConfirmDialog
          open={deleteDialog.isOpen}
          onOpenChange={(open) => !open && deleteDialog.close()}
          onConfirm={deleteDialog.handleDelete}
          isPending={deleteDialog.isPending}
          title={t('hive:manage.removeHive', { defaultValue: 'Remove Hive' })}
          description={t('hive:manage.removeHiveConfirmation', {
            defaultValue:
              'Are you sure you want to remove this hive? The hive will be archived and its data removed from active view.',
          })}
        />
      </ActionSidebarContainer>

      {hive && (
        <SplitWizard hive={hive} open={splitOpen} onOpenChange={setSplitOpen} />
      )}
    </div>
  );
};
