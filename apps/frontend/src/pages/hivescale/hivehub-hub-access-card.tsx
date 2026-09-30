import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Save, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import {
  hiveHubErrorMessage,
  useHiveScaleDeviceConfig,
  useStartHiveScaleProvisioning,
  useUpdateHiveScaleConfig,
  type HiveScaleDevice,
  type HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const DEFAULT_INSPECTION_TIMEOUT = 60;
const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function HiveHubHubAccessCard({
  device,
  latest,
}: Readonly<{
  device: HiveScaleDevice;
  latest: HiveScaleMeasurement | null | undefined;
}>) {
  const { t } = useTranslation('hivescale');
  const configQuery = useHiveScaleDeviceConfig(device.device_id);
  const updateConfig = useUpdateHiveScaleConfig(device.device_id);
  const startProvisioning = useStartHiveScaleProvisioning(device.device_id);
  const config = configQuery.data;

  const canEdit = device.role === 'owner' || device.role === 'admin';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [timeoutEdit, setTimeoutEdit] = useState<string | null>(null);
  const storedTimeout =
    config?.inspection_timeout_minutes ?? DEFAULT_INSPECTION_TIMEOUT;
  const timeoutValue = timeoutEdit ?? String(storedTimeout);

  const intervalMinutes = config
    ? Math.max(1, Math.round(config.send_interval_seconds / 60))
    : null;
  const lastCheckIn = latest?.received_at ?? device.last_seen_at;

  const onOpenAp = () => {
    startProvisioning.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success(t('hubAccess.ap.queued'));
      },
      onError: error =>
        toast.error(hiveHubErrorMessage(error, t('hubAccess.ap.failed'))),
    });
  };

  const onSaveTimeout = (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit || !config) return;
    const minutes = Number(timeoutValue);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      toast.error(t('hubAccess.inspection.invalid'));
      return;
    }
    if (minutes === storedTimeout) {
      toast.info(t('hubAccess.noChanges'));
      return;
    }
    updateConfig.mutate(
      { inspection_timeout_minutes: minutes },
      {
        onSuccess: () => {
          setTimeoutEdit(null);
          toast.success(t('hubAccess.inspection.saved'));
        },
        onError: error =>
          toast.error(
            hiveHubErrorMessage(error, t('hubAccess.inspection.saveFailed')),
          ),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          {t('hubAccess.title')}
        </CardTitle>
        <CardDescription>{t('hubAccess.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canEdit && (
          <p className="text-sm text-muted-foreground">
            {t('hubAccess.readOnly', { role: device.role })}
          </p>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-medium">{t('hubAccess.ap.title')}</h3>
          <p className="text-xs text-muted-foreground">
            {t('hubAccess.ap.description')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('hubAccess.ap.lastCheckIn', {
              time: lastCheckIn
                ? dateFormat.format(new Date(lastCheckIn))
                : t('common.never'),
            })}
          </p>
          {canEdit && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(true)}
              disabled={startProvisioning.isPending}
            >
              <Wifi className="mr-2 h-4 w-4" />
              {t('hubAccess.ap.open')}
            </Button>
          )}
        </section>

        <Separator />

        <form className="space-y-3" onSubmit={onSaveTimeout}>
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            {t('hubAccess.inspection.title')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('hubAccess.inspection.description')}
          </p>
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="hub-inspection-timeout">
              {t('hubAccess.inspection.label')}
            </Label>
            <Input
              id="hub-inspection-timeout"
              type="number"
              min={1}
              max={1440}
              step={1}
              value={timeoutValue}
              onChange={event => setTimeoutEdit(event.target.value)}
              disabled={!canEdit || !config || updateConfig.isPending}
            />
          </div>
          {canEdit && (
            <Button type="submit" disabled={!config || updateConfig.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateConfig.isPending
                ? t('common.saving')
                : t('hubAccess.inspection.save')}
            </Button>
          )}
        </form>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('hubAccess.ap.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {intervalMinutes != null
                ? t('hubAccess.ap.confirmTiming', { count: intervalMinutes })
                : t('hubAccess.ap.confirmTimingUnknown')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t('hubAccess.ap.confirmOffline')}</p>
            <p>{t('hubAccess.ap.confirmTimeout')}</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              {t('hubAccess.cancel')}
            </Button>
            <Button
              type="button"
              onClick={onOpenAp}
              disabled={startProvisioning.isPending}
            >
              {startProvisioning.isPending
                ? t('hubAccess.ap.queueing')
                : t('hubAccess.ap.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
