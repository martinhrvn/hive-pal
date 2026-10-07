import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, HardDrive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  hiveScaleExportUrl,
  useDeleteHiveScaleMeasurements,
  useHiveScaleExportSummary,
  type HiveScaleDevice,
  type HiveScaleExportQuery,
} from '@/api/hooks/useHiveScale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { hiveSlotName, type HiveMappingBySlot } from './hivehub-links';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const formatDate = (value: string | null | undefined) =>
  value ? dateFormat.format(new Date(value)) : '—';

// <input type="date"> yields YYYY-MM-DD; the range covers whole local days.
const dayStartIso = (day: string) =>
  day ? new Date(`${day}T00:00:00`).toISOString() : undefined;
const dayEndIso = (day: string) =>
  day ? new Date(`${day}T23:59:59.999`).toISOString() : undefined;
const localDateTimeIso = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export function HiveHubDataCard({
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
  const canExport = device.role === 'owner' || device.role === 'admin';
  const canDelete = device.role === 'owner';

  // ── Export ────────────────────────────────────────────────────────────────
  const [fromDay, setFromDay] = useState('');
  const [toDay, setToDay] = useState('');
  const [selectedHives, setSelectedHives] = useState<number[]>([]);
  const exportQuery = useMemo<HiveScaleExportQuery>(
    () => ({ start_at: dayStartIso(fromDay), end_at: dayEndIso(toDay) }),
    [fromDay, toDay],
  );
  const exportRangeInvalid = !!fromDay && !!toDay && fromDay > toDay;
  const exportSummary = useHiveScaleExportSummary(deviceId, exportQuery, {
    enabled: canExport && !exportRangeInvalid,
  });
  const summaryDevice =
    exportSummary.data?.devices.find(d => d.device_id === deviceId) ??
    exportSummary.data?.devices[0];
  const exportCount = exportSummary.data?.total_measurements;
  const downloadUrl = hiveScaleExportUrl(deviceId, {
    ...exportQuery,
    hive: selectedHives,
  });

  const toggleHive = (slot: number, checked: boolean) =>
    setSelectedHives(current =>
      checked
        ? [...current, slot].sort((a, b) => a - b)
        : current.filter(s => s !== slot),
    );

  // ── Range delete ──────────────────────────────────────────────────────────
  const [deleteStart, setDeleteStart] = useState('');
  const [deleteEnd, setDeleteEnd] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteStartIso = localDateTimeIso(deleteStart);
  const deleteEndIso = localDateTimeIso(deleteEnd);
  const deleteQuery = useMemo<HiveScaleExportQuery>(
    () => ({
      start_at: deleteStartIso ?? undefined,
      end_at: deleteEndIso ?? undefined,
    }),
    [deleteStartIso, deleteEndIso],
  );
  // Only counted once the user asks to review, so typing a range does not
  // fire a summary request per keystroke.
  const deleteSummary = useHiveScaleExportSummary(deviceId, deleteQuery, {
    enabled: canDelete && confirmOpen && !!deleteStartIso && !!deleteEndIso,
  });
  const deleteCount = deleteSummary.data?.total_measurements;
  const deleteMeasurements = useDeleteHiveScaleMeasurements(deviceId);

  const onReviewDelete = (event: FormEvent) => {
    event.preventDefault();
    if (!canDelete) return;
    if (!deleteStartIso || !deleteEndIso) {
      toast.error(t('dataTools.delete.errors.missingRange'));
      return;
    }
    if (new Date(deleteEndIso) < new Date(deleteStartIso)) {
      toast.error(t('dataTools.delete.errors.invalidRange'));
      return;
    }
    if (claimCode.trim().length < 4) {
      toast.error(t('dataTools.delete.errors.missingClaimCode'));
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirmDelete = () => {
    if (!deleteStartIso || !deleteEndIso) return;
    deleteMeasurements.mutate(
      {
        start_at: deleteStartIso,
        end_at: deleteEndIso,
        claim_code: claimCode.trim(),
      },
      {
        onSuccess: result => {
          setConfirmOpen(false);
          setClaimCode('');
          toast.success(
            t('dataTools.delete.success', { count: result.deleted }),
          );
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          {t('dataTools.title')}
        </CardTitle>
        <CardDescription>{t('dataTools.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Download className="h-4 w-4" />
              {t('dataTools.export.title')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('dataTools.export.description')}
            </p>
          </div>

          {canExport ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="data-export-from">
                    {t('dataTools.export.from')}
                  </Label>
                  <Input
                    id="data-export-from"
                    type="date"
                    value={fromDay}
                    max={toDay || undefined}
                    onChange={event => setFromDay(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-export-to">
                    {t('dataTools.export.to')}
                  </Label>
                  <Input
                    id="data-export-to"
                    type="date"
                    value={toDay}
                    min={fromDay || undefined}
                    onChange={event => setToDay(event.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dataTools.export.rangeHelp')}
              </p>

              {reportedHives.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('dataTools.export.hives')}</Label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {reportedHives.map(slot => (
                      <div key={slot} className="flex items-center gap-2">
                        <Checkbox
                          id={`data-export-hive-${slot}`}
                          checked={selectedHives.includes(slot)}
                          onCheckedChange={checked =>
                            toggleHive(slot, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`data-export-hive-${slot}`}
                          className="font-normal"
                        >
                          {hiveSlotName(
                            hiveNames,
                            slot,
                            t('dataTools.hiveFallback', { slot }),
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedHives.length === 0
                      ? t('dataTools.export.allHives')
                      : t('dataTools.export.someHives', {
                          count: selectedHives.length,
                        })}
                  </p>
                </div>
              )}

              <div className="rounded-md border p-3 text-xs text-muted-foreground">
                {exportRangeInvalid ? (
                  <p className="text-destructive">
                    {t('dataTools.export.invalidRange')}
                  </p>
                ) : exportSummary.isLoading ? (
                  <p>{t('common.loading')}</p>
                ) : exportSummary.isError ? (
                  <p className="text-destructive">
                    {t('dataTools.export.summaryFailed')}
                  </p>
                ) : (
                  <>
                    <p className="font-medium text-foreground">
                      {t('dataTools.export.count', {
                        count: exportCount ?? 0,
                      })}
                    </p>
                    <p>
                      {t('dataTools.export.span', {
                        first: formatDate(summaryDevice?.first_measured_at),
                        last: formatDate(summaryDevice?.last_measured_at),
                      })}
                    </p>
                  </>
                )}
              </div>

              {exportRangeInvalid || exportCount === 0 ? (
                <Button type="button" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  {t('dataTools.export.download')}
                </Button>
              ) : (
                <Button asChild>
                  <a href={downloadUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    {t('dataTools.export.download')}
                  </a>
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {t('dataTools.export.formatHelp')}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('dataTools.export.noPermission', { role: device.role })}
            </p>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Trash2 className="h-4 w-4" />
              {t('dataTools.delete.title')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('dataTools.delete.description')}
            </p>
          </div>

          {canDelete ? (
            <form className="space-y-4" onSubmit={onReviewDelete}>
              <Alert variant="destructive">
                <Trash2 className="h-4 w-4" />
                <AlertTitle>{t('dataTools.delete.warningTitle')}</AlertTitle>
                <AlertDescription>
                  {t('dataTools.delete.warning')}
                </AlertDescription>
              </Alert>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="data-delete-start">
                    {t('dataTools.delete.start')}
                  </Label>
                  <Input
                    id="data-delete-start"
                    type="datetime-local"
                    value={deleteStart}
                    onChange={event => setDeleteStart(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-delete-end">
                    {t('dataTools.delete.end')}
                  </Label>
                  <Input
                    id="data-delete-end"
                    type="datetime-local"
                    value={deleteEnd}
                    min={deleteStart || undefined}
                    onChange={event => setDeleteEnd(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="data-delete-claim-code">
                  {t('dataTools.delete.claimCode')}
                </Label>
                <Input
                  id="data-delete-claim-code"
                  value={claimCode}
                  autoComplete="off"
                  maxLength={128}
                  onChange={event => setClaimCode(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('dataTools.delete.claimCodeHelp')}
                </p>
              </div>
              <Button type="submit" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('dataTools.delete.review')}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('dataTools.delete.noPermission', { role: device.role })}
            </p>
          )}
        </section>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dataTools.delete.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('dataTools.delete.confirmRange', {
                start: formatDate(deleteStartIso),
                end: formatDate(deleteEndIso),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {deleteSummary.isLoading ? (
              <p className="text-muted-foreground">{t('common.loading')}</p>
            ) : deleteSummary.isError ? (
              <p className="text-destructive">
                {t('dataTools.delete.countFailed')}
              </p>
            ) : (
              <p className="font-medium">
                {t('dataTools.delete.confirmCount', {
                  count: deleteCount ?? 0,
                })}
              </p>
            )}
            <p className="text-muted-foreground">
              {t('dataTools.delete.confirmIrreversible')}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              {t('dataTools.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={
                deleteMeasurements.isPending ||
                deleteSummary.isLoading ||
                deleteCount === 0
              }
            >
              {deleteMeasurements.isPending
                ? t('dataTools.delete.deleting')
                : t('dataTools.delete.confirm', { count: deleteCount ?? 0 })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
