import React, { useState } from 'react';
import { useIsAdmin } from '@/hooks/use-is-admin';
import {
  useWorkerTokens,
  useCreateWorkerToken,
  useRevokeWorkerToken,
  useWorkerStatus,
} from '@/api/hooks/useWorkerTokens';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Trash2, Plus, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { WorkerToken } from 'shared-schemas';

const isWorkerOnline = (lastSeenAt: string | Date | null): boolean => {
  if (!lastSeenAt) return false;
  const last = new Date(lastSeenAt).getTime();
  return Date.now() - last < 2 * 60 * 1000;
};

const WorkerTokensPage: React.FC = () => {
  const isAdmin = useIsAdmin();
  const { data: tokens = [], isLoading, refetch } = useWorkerTokens();
  const { data: status } = useWorkerStatus();
  const createMutation = useCreateWorkerToken();
  const revokeMutation = useRevokeWorkerToken();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    );
  }

  const handleCreate = async () => {
    if (!name.trim()) return;
    const result = await createMutation.mutateAsync({ name: name.trim() });
    setCreatedToken(result.token);
    setName('');
  };

  const handleCloseCreated = () => {
    setCreatedToken(null);
    setCopied(false);
    setCreateOpen(false);
  };

  const handleCopy = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setCopied(true);
    toast.success('Token copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Worker Tokens</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New token
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Long-lived API tokens for pull-based transcription/analysis workers.
            Workers use these to claim and complete jobs from a remote machine
            (e.g. local Whisper + Ollama).{' '}
            {status && (
              <span className="block mt-1">
                <span
                  className={`inline-block h-2 w-2 rounded-full mr-2 ${
                    status.workersOnline > 0 ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                {status.workersOnline > 0
                  ? `${status.workersOnline} worker${
                      status.workersOnline > 1 ? 's' : ''
                    } online`
                  : 'No workers online'}
                {status.lastSeen && (
                  <span className="text-muted-foreground">
                    {' '}
                    · last seen{' '}
                    {formatDistanceToNow(new Date(status.lastSeen), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : tokens.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No worker tokens yet. Create one to allow a remote worker
                      to claim jobs.
                    </TableCell>
                  </TableRow>
                ) : (
                  tokens.map((t: WorkerToken) => {
                    const revoked = Boolean(t.revokedAt);
                    const online = !revoked && isWorkerOnline(t.lastSeenAt);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {t.prefix}…
                        </TableCell>
                        <TableCell>
                          {format(new Date(t.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {t.lastSeenAt ? (
                            <span title={new Date(t.lastSeenAt).toISOString()}>
                              {formatDistanceToNow(new Date(t.lastSeenAt), {
                                addSuffix: true,
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {revoked ? (
                            <Badge variant="destructive">Revoked</Badge>
                          ) : online ? (
                            <Badge>
                              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1" />
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Idle</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!revoked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => revokeMutation.mutate(t.id)}
                              disabled={revokeMutation.isPending}
                              title="Revoke"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseCreated();
          setCreateOpen(open);
        }}
      >
        <DialogContent>
          {createdToken ? (
            <>
              <DialogHeader>
                <DialogTitle>Token created</DialogTitle>
                <DialogDescription>
                  Copy this token now. It will not be shown again — only its
                  prefix will remain visible.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted font-mono text-sm break-all">
                <span className="flex-1">{createdToken}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  title="Copy"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseCreated}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>New worker token</DialogTitle>
                <DialogDescription>
                  Give the token a name to identify which machine or worker is
                  using it.
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder="e.g. home-desktop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) handleCreate();
                }}
                autoFocus
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!name.trim() || createMutation.isPending}
                >
                  Create
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkerTokensPage;
