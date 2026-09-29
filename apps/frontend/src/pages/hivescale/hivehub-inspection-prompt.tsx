import { useTranslation } from 'react-i18next';
import { Play, Radio, Square } from 'lucide-react';
import { toast } from 'sonner';
import {
  useStartHiveScaleInspection,
  useStopHiveScaleInspection,
  type HiveScaleDevice,
  type HiveScaleInspectionStatus,
} from '@/api/hooks/useHiveScale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  canControlInspection,
  inspectionCoversSlot,
  useHiveHubInspectionStatus,
} from './hivehub-inspection-card';
import { useHiveHubSlotsForHive, type HiveHubSlotRef } from './hivehub-links';

export const hiveHubDeviceName = (device: HiveScaleDevice) =>
  device.display_name?.trim() || device.device_id;

/**
 * Start (scoped to one slot) / stop button for inspection mode. Stop always
 * ends the hub's open inspection: HiveHub keeps one window per device.
 */
export function HiveHubInspectionControl({
  device,
  slot,
  status,
  size = 'sm',
}: Readonly<{
  device: HiveScaleDevice;
  slot: number;
  status: HiveScaleInspectionStatus | undefined;
  size?: 'sm' | 'default';
}>) {
  const { t } = useTranslation('hivescale');
  const start = useStartHiveScaleInspection(device.device_id);
  const stop = useStopHiveScaleInspection(device.device_id);
  if (!canControlInspection(device) || !status) return null;

  if (status.active || status.pending) {
    return (
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled={stop.isPending}
        onClick={() =>
          stop.mutate(
            {},
            {
              onSuccess: () => toast.success(t('inspectionMode.toast.stopped')),
              onError: error => toast.error(error.message),
            },
          )
        }
      >
        <Square className="mr-1.5 h-3.5 w-3.5" />
        {stop.isPending
          ? t('inspectionMode.stopping')
          : t('inspectionMode.stop')}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      disabled={start.isPending}
      onClick={() =>
        start.mutate(
          { hives: [slot] },
          {
            onSuccess: () => toast.success(t('inspectionMode.toast.started')),
            onError: error => toast.error(error.message),
          },
        )
      }
    >
      <Play className="mr-1.5 h-3.5 w-3.5" />
      {start.isPending
        ? t('inspectionMode.starting')
        : t('inspectionMode.start')}
    </Button>
  );
}

/** One-line state description for a slot, shared with the hive card. */
function useHiveHubInspectionMessage(
  ref: HiveHubSlotRef,
  status: HiveScaleInspectionStatus | undefined,
) {
  const { t } = useTranslation('hivescale');
  const params = { device: hiveHubDeviceName(ref.device), hive: ref.name };
  if (!status || !(status.active || status.pending)) {
    return t('hiveLink.prompt.message', params);
  }
  if (!inspectionCoversSlot(status.inspection, ref.slot)) {
    return t('hiveLink.prompt.activeOther', params);
  }
  return status.pending
    ? t('hiveLink.prompt.pending', params)
    : t('hiveLink.prompt.active', params);
}

function PromptRow({ slotRef }: Readonly<{ slotRef: HiveHubSlotRef }>) {
  const status = useHiveHubInspectionStatus(slotRef.device.device_id);
  const message = useHiveHubInspectionMessage(slotRef, status.data);
  if (!status.data) return null;
  const isOn = status.data.active || status.data.pending;

  return (
    <Alert
      className={cn(
        isOn &&
          'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
      )}
    >
      <Radio className="h-4 w-4" />
      <AlertDescription
        className={cn(
          'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
          isOn && 'text-emerald-900/90 dark:text-emerald-100/90',
        )}
      >
        <span>{message}</span>
        <div className="shrink-0">
          <HiveHubInspectionControl
            device={slotRef.device}
            slot={slotRef.slot}
            status={status.data}
          />
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Nudge on HivePal's inspection pages: when the hive is on a HiveHub, offer to
 * switch inspection mode on so lifting frames isn't read as a swarm. Never
 * starts anything on its own.
 */
export function HiveHubInspectionPrompt({
  hiveId,
  className,
}: Readonly<{ hiveId?: string; className?: string }>) {
  const { slots, isLoading } = useHiveHubSlotsForHive(hiveId);
  const visible = slots.filter(ref => canControlInspection(ref.device));
  if (isLoading || visible.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {visible.map(ref => (
        <PromptRow key={`${ref.device.device_id}:${ref.slot}`} slotRef={ref} />
      ))}
    </div>
  );
}
