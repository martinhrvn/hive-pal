import { useRef, useState } from 'react';
import { toast } from 'sonner';
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
    (j) =>
      j.type === 'EXPORT' &&
      (j.status === 'PENDING' || j.status === 'RUNNING'),
  );
  const hasActiveImport = jobs.some(
    (j) =>
      j.type === 'IMPORT' &&
      (j.status === 'PENDING' || j.status === 'RUNNING'),
  );

  const handleStartExport = async () => {
    try {
      await startExport.mutateAsync();
      toast.success('Export started', {
        description: 'Your export is being prepared. This may take a few minutes.',
      });
    } catch (err) {
      toast.error('Failed to start export', {
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
      toast.success('Import started', {
        description: 'Your data is being imported. This may take a few minutes.',
      });
    } catch (err) {
      toast.error('Failed to start import', {
        description: (err as Error).message,
      });
    }
  };

  const handleDownload = (job: AccountTransferJob) => {
    fetch(`/api/account-transfer/jobs/${job.id}/download`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
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
      .catch((err) => {
        toast.error('Download failed', { description: (err as Error).message });
      });
  };

  const handleDelete = async (job: AccountTransferJob) => {
    if (!confirm('Delete this job and its stored file?')) return;
    try {
      await deleteJob.mutateAsync(job.id);
      toast.success('Job deleted');
    } catch (err) {
      toast.error('Failed to delete job', { description: (err as Error).message });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Data Transfer</h1>
        <p className="text-muted-foreground">
          Export your account data for backup, or import a previous export to
          this account.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export
            </CardTitle>
            <CardDescription>
              Download a ZIP archive containing all apiaries you own and their
              data, including photos, documents, and audio.
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
              {hasActiveExport ? 'Export in progress…' : 'Start export'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import
            </CardTitle>
            <CardDescription>
              Restore data from a previously created export ZIP. Imports are
              additive — every imported apiary becomes a new record under your
              account.
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
              {hasActiveImport ? 'Import in progress…' : 'Choose ZIP file…'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent jobs</CardTitle>
            <CardDescription>
              Exports remain downloadable for 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobsQuery.isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
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
                          {new Date(job.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.status === 'RUNNING'
                            ? (job.progress ?? '…')
                            : job.status === 'FAILED'
                              ? (job.errorMessage ?? 'Failed')
                              : isExpired
                                ? 'Expired'
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
                                Download
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
                                View summary
                              </Button>
                            )}
                          {job.status === 'FAILED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedJob(job)}
                            >
                              View error
                            </Button>
                          )}
                          {job.status !== 'RUNNING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(job)}
                            >
                              Delete
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
        onOpenChange={(open) => !open && setConfirmImport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Import data into your account?
            </DialogTitle>
            <DialogDescription>
              This will add all data from{' '}
              <span className="font-medium">{confirmImport?.name}</span> to your
              account. Imports are additive and cannot be automatically undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmImport(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport}>Start import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedJob !== null}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedJob?.status === 'FAILED' ? 'Job error' : 'Import summary'}
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
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
