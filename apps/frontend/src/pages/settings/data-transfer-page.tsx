import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Trans, useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Upload, Loader2, AlertTriangle } from 'lucide-react';
import type { AccountTransferJob } from 'shared-schemas';
import {
  useAccountTransferJobs,
  useDeleteAccountTransferJob,
  useStartExport,
  useStartImport,
} from '@/api/hooks/useAccountTransfer';
import { useDateFormat } from '@/hooks/use-date-format';

const statusVariant: Record<
  AccountTransferJob['status'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'outline',
  RUNNING: 'secondary',
  COMPLETED: 'default',
  FAILED: 'destructive',
};

export const DataTransferPage = () => {
  const { t } = useTranslation('common');
  const { formatDateTime } = useDateFormat();
  const jobsQuery = useAccountTransferJobs();
  const startExport = useStartExport();
  const startImport = useStartImport();
  const deleteJob = useDeleteAccountTransferJob();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmImport, setConfirmImport] = useState<File | null>(null);
  const [selectedJob, setSelectedJob] = useState<AccountTransferJob | null>(
    null,
  );

  const jobs = jobsQuery.data ?? [];
  const hasActiveExport = jobs.some(
    j =>
      j.type === 'EXPORT' && (j.status === 'PENDING' || j.status === 'RUNNING'),
  );
  const hasActiveImport = jobs.some(
    j =>
      j.type === 'IMPORT' && (j.status === 'PENDING' || j.status === 'RUNNING'),
  );

  const handleStartExport = async () => {
    try {
      await startExport.mutateAsync();
      toast.success(t('settings.dataTransfer.toasts.exportStarted'), {
        description: t('settings.dataTransfer.toasts.exportStartedDescription'),
      });
    } catch (err) {
      toast.error(t('settings.dataTransfer.toasts.exportFailed'), {
        description: (err as Error).message,
      });
    }
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setConfirmImport(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!confirmImport) return;
    const file = confirmImport;
    setConfirmImport(null);
    try {
      await startImport.mutateAsync(file);
      toast.success(t('settings.dataTransfer.toasts.importStarted'), {
        description: t('settings.dataTransfer.toasts.importStartedDescription'),
      });
    } catch (err) {
      toast.error(t('settings.dataTransfer.toasts.importFailed'), {
        description: (err as Error).message,
      });
    }
  };

  const handleDownload = (job: AccountTransferJob) => {
    fetch(`/api/account-transfer/jobs/${job.id}/download`, {
      credentials: 'include',
    })
      .then(async res => {
        if (!res.ok)
          throw new Error(
            t('settings.dataTransfer.toasts.downloadFailedWithStatus', {
              status: res.statusText,
            }),
          );
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hivepal-export-${job.id}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        toast.error(t('settings.dataTransfer.toasts.downloadFailed'), {
          description: (err as Error).message,
        });
      });
  };

  const handleDelete = async (job: AccountTransferJob) => {
    if (!confirm(t('settings.dataTransfer.deleteConfirm'))) return;
    try {
      await deleteJob.mutateAsync(job.id);
      toast.success(t('settings.dataTransfer.toasts.jobDeleted'));
    } catch (err) {
      toast.error(t('settings.dataTransfer.toasts.deleteFailed'), {
        description: (err as Error).message,
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {t('settings.dataTransfer.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('settings.dataTransfer.description')}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('actions.export')}
            </CardTitle>
            <CardDescription>
              {t('settings.dataTransfer.exportDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleStartExport}
              disabled={hasActiveExport || startExport.isPending}
              className="gap-2"
            >
              {hasActiveExport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {hasActiveExport
                ? t('settings.dataTransfer.exportInProgress')
                : t('settings.dataTransfer.startExport')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('actions.import')}
            </CardTitle>
            <CardDescription>
              {t('settings.dataTransfer.importDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              hidden
              onChange={handleFilePicked}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={hasActiveImport || startImport.isPending}
              variant="outline"
              className="gap-2"
            >
              {hasActiveImport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {hasActiveImport
                ? t('settings.dataTransfer.importInProgress')
                : t('settings.dataTransfer.chooseFile')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.dataTransfer.recentJobs')}</CardTitle>
            <CardDescription>
              {t('settings.dataTransfer.recentJobsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobsQuery.isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('settings.dataTransfer.noJobs')}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('settings.dataTransfer.columns.type')}
                    </TableHead>
                    <TableHead>
                      {t('settings.dataTransfer.columns.status')}
                    </TableHead>
                    <TableHead>
                      {t('settings.dataTransfer.columns.created')}
                    </TableHead>
                    <TableHead>
                      {t('settings.dataTransfer.columns.progress')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('actions.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map(job => {
                    const isExpired =
                      job.type === 'EXPORT' &&
                      job.status === 'COMPLETED' &&
                      !job.hasResult;
                    return (
                      <TableRow key={job.id}>
                        <TableCell>{job.type}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[job.status]}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(job.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.status === 'RUNNING'
                            ? (job.progress ?? '…')
                            : job.status === 'FAILED'
                              ? (job.errorMessage ??
                                t('settings.dataTransfer.failed'))
                              : isExpired
                                ? t('settings.dataTransfer.expired')
                                : ''}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {job.status === 'COMPLETED' &&
                            job.type === 'EXPORT' &&
                            job.hasResult && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(job)}
                              >
                                {t('actions.download')}
                              </Button>
                            )}
                          {job.status === 'COMPLETED' &&
                            job.type === 'IMPORT' &&
                            job.summary !== null && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedJob(job)}
                              >
                                {t('settings.dataTransfer.viewSummary')}
                              </Button>
                            )}
                          {job.status === 'FAILED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedJob(job)}
                            >
                              {t('settings.dataTransfer.viewError')}
                            </Button>
                          )}
                          {job.status !== 'RUNNING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(job)}
                            >
                              {t('actions.delete')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={confirmImport !== null}
        onOpenChange={open => !open && setConfirmImport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('settings.dataTransfer.confirmImportTitle')}
            </DialogTitle>
            <DialogDescription>
              <Trans
                t={t}
                i18nKey="settings.dataTransfer.confirmImportDescription"
                values={{ fileName: confirmImport?.name }}
                components={{ bold: <span className="font-medium" /> }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmImport(null)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleConfirmImport}>
              {t('settings.dataTransfer.startImport')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedJob !== null}
        onOpenChange={open => !open && setSelectedJob(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedJob?.status === 'FAILED'
                ? t('settings.dataTransfer.jobError')
                : t('settings.dataTransfer.importSummary')}
            </DialogTitle>
          </DialogHeader>
          {selectedJob?.status === 'FAILED' ? (
            <p className="text-sm">{selectedJob.errorMessage}</p>
          ) : (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(selectedJob?.summary, null, 2)}
            </pre>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedJob(null)}>
              {t('actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
