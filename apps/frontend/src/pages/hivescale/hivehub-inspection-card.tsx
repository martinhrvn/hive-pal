import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Check, Pencil, Play, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useHiveScaleInspections,
  useHiveScaleInspectionStatus,
  useStartHiveScaleInspection,
  useStopHiveScaleInspection,
  useUpdateHiveScaleInspection,
  type HiveScaleDevice,
  type HiveScaleInspection,
  type HiveScaleInspectionStatus,
} from '@/api/hooks/useHiveScale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { hiveSlotName, type HiveMappingBySlot } from './hivehub-links';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const timeFormat = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });

export const formatInspectionTime = (iso: string | null | undefined) =>
  iso ? dateTimeFormat.format(new Date(iso)) : '—';

export const canControlInspection = (device: HiveScaleDevice | undefined) =>
  device?.role === 'owner' || device?.role === 'admin';

/** Empty or missing hive list means the whole hub. */
export const inspectionCoversSlot = (
  inspection: HiveScaleInspection | null | undefined,
  slot: number,
) => !inspection?.hives?.length || inspection.hives.includes(slot);

/**
 * Inspection status that polls faster while an inspection is open or waiting
 * for the hub: that is when the beekeeper is standing at the hive watching it.
 */
export const useHiveHubInspectionStatus = (
  deviceId: string | undefined,
  options: { enabled?: boolean } = {},
) => {
  const [fast, setFast] = useState(false);
  const status = useHiveScaleInspectionStatus(deviceId, {
    enabled: options.enabled,
    refetchInterval: fast ? 15000 : undefined,
  });
  const shouldBeFast = !!(status.data?.active || status.data?.pending);
  if (shouldBeFast !== fast) setFast(shouldBeFast);
  return status;
};

const sourceLabel = (t: TFunction, source: string) =>
  ['device', 'api', 'dashboard'].includes(source)
    ? t(`inspectionMode.source.${source}`)
    : source;

const endReasonLabel = (t: TFunction, reason: string) =>
  ['timeout', 'device', 'api', 'dashboard'].includes(reason)
    ? t(`inspectionMode.endReason.${reason}`)
    : reason;

const formatDuration = (t: TFunction, startIso: string, endIso: string) => {
  const minutes = Math.max(
    0,
    Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60000),
  );
  if (minutes < 60)
    return t('inspectionMode.duration.minutes', { count: minutes });
  return t('inspectionMode.duration.hoursMinutes', {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  });
};

const scopeLabel = (
  t: TFunction,
  hives: number[] | null | undefined,
  hiveNames: HiveMappingBySlot,
) =>
  hives?.length
    ? hives.map(slot => hiveSlotName(hiveNames, slot)).join(', ')
    : t('inspectionMode.scope.wholeHub');

/** Active / pending / off badge for an inspection status. */
export function HiveHubInspectionStatusBadge({
  status,
  className,
}: Readonly<{
  status: HiveScaleInspectionStatus | undefined;
  className?: string;
}>) {
  const { t } = useTranslation('hivescale');
  if (status?.pending) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
          className,
        )}
      >
        {t('inspectionMode.status.pending')}
      </Badge>
    );
  }
  if (status?.active) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
          className,
        )}
      >
        {t('inspectionMode.status.active', {
          time: formatInspectionTime(status.inspection?.started_at),
        })}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn('text-muted-foreground', className)}>
      {t('inspectionMode.status.off')}
    </Badge>
  );
}

function StartInspectionDialog({
  device,
  hiveNames,
  reportedHives,
  open,
  onOpenChange,
}: Readonly<{
  device: HiveScaleDevice;
  hiveNames: HiveMappingBySlot;
  reportedHives: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) {
  const { t } = useTranslation('hivescale');
  const start = useStartHiveScaleInspection(device.device_id);
  const [wholeHub, setWholeHub] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [note, setNote] = useState('');

  const reset = () => {
    setWholeHub(true);
    setSelected([]);
    setNote('');
  };

  const toggleSlot = (slot: number, checked: boolean) => {
    setSelected(prev =>
      checked
        ? [...prev, slot].sort((a, b) => a - b)
        : prev.filter(s => s !== slot),
    );
  };

  const canSubmit = wholeHub || selected.length > 0;

  const submit = () => {
    const trimmed = note.trim();
    start.mutate(
      {
        ...(wholeHub ? {} : { hives: selected }),
        ...(trimmed ? { note: trimmed } : {}),
      },
      {
        onSuccess: () => {
          toast.success(t('inspectionMode.toast.started'));
          reset();
          onOpenChange(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('inspectionMode.startDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('inspectionMode.startDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('inspectionMode.startDialog.hivesLabel')}
            </Label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={wholeHub}
                onCheckedChange={checked => setWholeHub(checked === true)}
              />
              {t('inspectionMode.startDialog.wholeHub')}
            </label>
            {reportedHives.length > 0 && (
              <div className="grid grid-cols-1 gap-2 pl-6 sm:grid-cols-2">
                {reportedHives.map(slot => (
                  <label
                    key={slot}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      wholeHub && 'text-muted-foreground',
                    )}
                  >
                    <Checkbox
                      disabled={wholeHub}
                      checked={wholeHub || selected.includes(slot)}
                      onCheckedChange={checked =>
                        toggleSlot(slot, checked === true)
                      }
                    />
                    <span className="truncate">
                      {hiveSlotName(hiveNames, slot)}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {!canSubmit && (
              <p className="text-xs text-muted-foreground">
                {t('inspectionMode.startDialog.selectHive')}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hivehub-inspection-start-note">
              {t('inspectionMode.noteLabel')}
            </Label>
            <Textarea
              id="hivehub-inspection-start-note"
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder={t('inspectionMode.notePlaceholder')}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('inspectionMode.cancel')}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit || start.isPending}
          >
            {start.isPending
              ? t('inspectionMode.starting')
              : t('inspectionMode.startDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StopInspectionDialog({
  deviceId,
  open,
  onOpenChange,
}: Readonly<{
  deviceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) {
  const { t } = useTranslation('hivescale');
  const stop = useStopHiveScaleInspection(deviceId);
  const [note, setNote] = useState('');

  const submit = () => {
    const trimmed = note.trim();
    stop.mutate(trimmed ? { note: trimmed } : {}, {
      onSuccess: () => {
        toast.success(t('inspectionMode.toast.stopped'));
        setNote('');
        onOpenChange(false);
      },
      onError: error => toast.error(error.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('inspectionMode.stopDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('inspectionMode.stopDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="hivehub-inspection-stop-note">
            {t('inspectionMode.noteLabel')}
          </Label>
          <Textarea
            id="hivehub-inspection-stop-note"
            value={note}
            onChange={event => setNote(event.target.value)}
            placeholder={t('inspectionMode.notePlaceholder')}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('inspectionMode.cancel')}
          </Button>
          <Button type="button" onClick={submit} disabled={stop.isPending}>
            {stop.isPending
              ? t('inspectionMode.stopping')
              : t('inspectionMode.stopDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InspectionNote({
  deviceId,
  inspection,
  canEdit,
}: Readonly<{
  deviceId: string;
  inspection: HiveScaleInspection;
  canEdit: boolean;
}>) {
  const { t } = useTranslation('hivescale');
  const update = useUpdateHiveScaleInspection(deviceId);
  const [draft, setDraft] = useState<string | null>(null);

  if (draft !== null) {
    const save = () => {
      const trimmed = draft.trim();
      update.mutate(
        { id: inspection.id, note: trimmed || null },
        {
          onSuccess: () => {
            toast.success(t('inspectionMode.toast.noteSaved'));
            setDraft(null);
          },
          onError: error => toast.error(error.message),
        },
      );
    };
    return (
      <div className="mt-2 space-y-2">
        <Textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder={t('inspectionMode.notePlaceholder')}
          rows={2}
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={update.isPending}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            {update.isPending
              ? t('common.saving')
              : t('inspectionMode.history.saveNote')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setDraft(null)}
            disabled={update.isPending}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            {t('inspectionMode.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  if (!inspection.note && !canEdit) return null;
  return (
    <div className="mt-1 flex items-start gap-1">
      {inspection.note ? (
        <p className="whitespace-pre-wrap text-sm">{inspection.note}</p>
      ) : null}
      {canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 shrink-0 px-1.5 text-xs text-muted-foreground"
          onClick={() => setDraft(inspection.note ?? '')}
          aria-label={
            inspection.note
              ? t('inspectionMode.history.editNote')
              : t('inspectionMode.history.addNote')
          }
        >
          <Pencil className="h-3 w-3" />
          {!inspection.note && (
            <span className="ml-1">{t('inspectionMode.history.addNote')}</span>
          )}
        </Button>
      )}
    </div>
  );
}

function InspectionRow({
  deviceId,
  inspection,
  hiveNames,
  canEdit,
}: Readonly<{
  deviceId: string;
  inspection: HiveScaleInspection;
  hiveNames: HiveMappingBySlot;
  canEdit: boolean;
}>) {
  const { t } = useTranslation('hivescale');
  const start = new Date(inspection.started_at);
  const end = inspection.ended_at ? new Date(inspection.ended_at) : null;
  const sameDay = end && start.toDateString() === end.toDateString();
  const span = end
    ? `${dateTimeFormat.format(start)} – ${
        sameDay ? timeFormat.format(end) : dateTimeFormat.format(end)
      }`
    : `${dateTimeFormat.format(start)} – ${t('inspectionMode.history.ongoing')}`;

  return (
    <li className="rounded-md border px-3 py-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium">{span}</span>
        <span className="text-xs text-muted-foreground">
          {inspection.ended_at
            ? formatDuration(t, inspection.started_at, inspection.ended_at)
            : null}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{scopeLabel(t, inspection.hives, hiveNames)}</span>
        <span>
          {t('inspectionMode.history.startedVia', {
            source: sourceLabel(t, inspection.source),
          })}
        </span>
        {inspection.end_reason && (
          <span>
            {t('inspectionMode.history.ended', {
              reason: endReasonLabel(t, inspection.end_reason),
            })}
          </span>
        )}
      </div>
      <InspectionNote
        deviceId={deviceId}
        inspection={inspection}
        canEdit={canEdit}
      />
    </li>
  );
}

export function HiveHubInspectionCard({
  device,
  hiveNames,
  reportedHives,
}: Readonly<{
  device: HiveScaleDevice;
  hiveNames: HiveMappingBySlot;
  reportedHives: number[];
}>) {
  const { t } = useTranslation('hivescale');
  const deviceId = device.device_id;
  const canControl = canControlInspection(device);
  const status = useHiveHubInspectionStatus(deviceId);
  const inspections = useHiveScaleInspections(deviceId, { limit: 20 });
  const [startOpen, setStartOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);

  const isOn = !!(status.data?.active || status.data?.pending);
  const current = status.data?.inspection;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t('inspectionMode.title')}</CardTitle>
            <CardDescription>{t('inspectionMode.description')}</CardDescription>
          </div>
          {status.isLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <HiveHubInspectionStatusBadge status={status.data} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isError && (
          <p className="text-sm text-muted-foreground">
            {t('inspectionMode.loadFailed')}
          </p>
        )}
        {status.data && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {isOn && current && (
              <p>
                {t('inspectionMode.scope.label', {
                  hives: scopeLabel(t, current.hives, hiveNames),
                })}
              </p>
            )}
            {status.data.pending && <p>{t('inspectionMode.pendingHint')}</p>}
            <p>
              {t('inspectionMode.timeoutNote', {
                count: status.data.timeout_minutes,
              })}
            </p>
          </div>
        )}

        {canControl ? (
          <div className="flex flex-wrap gap-2">
            {isOn ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStopOpen(true)}
              >
                <Square className="mr-2 h-4 w-4" />
                {t('inspectionMode.stop')}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStartOpen(true)}
                disabled={!status.data}
              >
                <Play className="mr-2 h-4 w-4" />
                {t('inspectionMode.start')}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('inspectionMode.viewerHint')}
          </p>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            {t('inspectionMode.history.title')}
          </h4>
          {inspections.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : inspections.data?.length ? (
            <ul className="space-y-2">
              {inspections.data.slice(0, 20).map(inspection => (
                <InspectionRow
                  key={inspection.id}
                  deviceId={deviceId}
                  inspection={inspection}
                  hiveNames={hiveNames}
                  canEdit={canControl}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('inspectionMode.history.empty')}
            </p>
          )}
        </div>
      </CardContent>

      {canControl && (
        <>
          <StartInspectionDialog
            device={device}
            hiveNames={hiveNames}
            reportedHives={reportedHives}
            open={startOpen}
            onOpenChange={setStartOpen}
          />
          <StopInspectionDialog
            deviceId={deviceId}
            open={stopOpen}
            onOpenChange={setStopOpen}
          />
        </>
      )}
    </Card>
  );
}
