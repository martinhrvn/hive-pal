import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  HiveScaleSdDeviceMismatchError,
  useImportHiveScaleSdData,
  type HiveScaleDevice,
  type HiveScaleSdImportResult,
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

export function HiveHubSdImportCard({
  device,
}: Readonly<{ device: HiveScaleDevice }>) {
  const { t } = useTranslation('hivescale');
  const [file, setFile] = useState<File | null>(null);
  // Reset key lets us clear the native file input after a successful upload.
  const [fileInputKey, setFileInputKey] = useState(0);
  const [lastResult, setLastResult] = useState<HiveScaleSdImportResult | null>(
    null,
  );
  const [mismatchIds, setMismatchIds] = useState<string[] | null>(null);

  const importSdData = useImportHiveScaleSdData(device.device_id);
  const canManage = device.role === 'owner' || device.role === 'admin';
  const disabled = !canManage;

  const runImport = (selected: File, force: boolean) => {
    importSdData.mutate(
      { file: selected, force },
      {
        onSuccess: result => {
          setMismatchIds(null);
          setFile(null);
          setFileInputKey(key => key + 1);
          setLastResult(result);
          toast.success(
            t('sdData.importSuccess', {
              count: result.inserted,
              duplicates: result.duplicates,
            }),
          );
        },
        onError: error => {
          // A file from another hub is usually a mix-up, so ask rather than
          // silently attributing its readings to this device.
          if (error instanceof HiveScaleSdDeviceMismatchError) {
            setMismatchIds(error.fileDeviceIds);
            return;
          }
          toast.error(error.message);
        },
      },
    );
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    if (!file) {
      toast.error(t('sdData.errors.missingFile'));
      return;
    }
    runImport(file, false);
  };

  return (
    <Card className={disabled ? 'opacity-60' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('sdData.title')}
        </CardTitle>
        <CardDescription>{t('sdData.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {!canManage && (
          <p className="text-sm text-muted-foreground">
            {t('sdData.notice.noPermission', { role: device.role })}
          </p>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="hivehub-sd-data-file">{t('sdData.file')}</Label>
            <Input
              key={fileInputKey}
              id="hivehub-sd-data-file"
              type="file"
              accept=".ndjson,.tar,.json,application/x-tar,application/octet-stream"
              onChange={event => setFile(event.target.files?.[0] ?? null)}
              disabled={disabled || importSdData.isPending}
            />
            <p className="text-xs text-muted-foreground">
              {t('sdData.accepts')}
            </p>
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={disabled || importSdData.isPending}
          >
            <Upload className="mr-2 h-4 w-4" />
            {importSdData.isPending
              ? t('sdData.importing')
              : t('sdData.upload')}
          </Button>
        </form>

        {lastResult && (
          <div className="mt-4 rounded-md border p-3 text-xs text-muted-foreground">
            <p>
              {t('sdData.result.imported', {
                inserted: lastResult.inserted,
                duplicates: lastResult.duplicates,
              })}
            </p>
            <p>
              {t('sdData.result.parsed', { count: lastResult.parsed })}
              {lastResult.skipped > 0
                ? t('sdData.result.skipped', { count: lastResult.skipped })
                : ''}
            </p>
          </div>
        )}
      </CardContent>

      <Dialog
        open={mismatchIds !== null}
        onOpenChange={open => {
          if (!open) setMismatchIds(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sdData.mismatch.title')}</DialogTitle>
            <DialogDescription>
              {t('sdData.mismatch.description', {
                device: device.display_name || device.device_id,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              {t('sdData.mismatch.fileDevices', {
                count: mismatchIds?.length ?? 0,
              })}
            </p>
            {mismatchIds && mismatchIds.length > 0 ? (
              <ul className="space-y-1">
                {mismatchIds.map(id => (
                  <li
                    key={id}
                    className="rounded bg-muted px-2 py-1 font-mono text-xs"
                  >
                    {id}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">—</p>
            )}
            <p className="text-muted-foreground">{t('sdData.mismatch.hint')}</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMismatchIds(null)}
            >
              {t('sdData.mismatch.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => file && runImport(file, true)}
              disabled={!file || importSdData.isPending}
            >
              {importSdData.isPending
                ? t('sdData.importing')
                : t('sdData.mismatch.force')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
