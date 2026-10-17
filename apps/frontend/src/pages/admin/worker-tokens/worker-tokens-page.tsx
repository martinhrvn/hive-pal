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
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/use-date-format';
import { Trash2, Plus, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { WorkerToken } from 'shared-schemas';

const isWorkerOnline = (lastSeenAt: string | Date | null): boolean => {
  if (!lastSeenAt) return false;
  const last = new Date(lastSeenAt).getTime();
  return Date.now() - last < 2 * 60 * 1000;
};

const WorkerTokensPage: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { formatDate } = useDateFormat();
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
          <p>{t('accessDenied')}</p>
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
    toast.success(t('workerTokens.copied'));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('workerTokens.title')}</span>
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
                {t('common:actions.refresh')}
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('workerTokens.newToken')}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {t('workerTokens.description')}{' '}
            {status && (
              <span className="block mt-1">
                <span
                  className={`inline-block h-2 w-2 rounded-full mr-2 ${
                    status.workersOnline > 0 ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                {status.workersOnline > 0
                  ? t('workerTokens.workersOnline', {
                      count: status.workersOnline,
                    })
                  : t('workerTokens.noWorkersOnline')}
                {status.lastSeen && (
                  <span className="text-muted-foreground">
                    {' '}
                    {t('workerTokens.lastSeenAgo', {
                      time: formatDistanceToNow(new Date(status.lastSeen), {
                        addSuffix: true,
                      }),
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
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.prefix')}</TableHead>
                  <TableHead>{t('table.created')}</TableHead>
                  <TableHead>{t('table.lastSeen')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('common:actions.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {t('common:status.loading')}
                    </TableCell>
                  </TableRow>
                ) : tokens.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t('workerTokens.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  tokens.map((token: WorkerToken) => {
                    const revoked = Boolean(token.revokedAt);
                    const online = !revoked && isWorkerOnline(token.lastSeenAt);
                    return (
                      <TableRow key={token.id}>
                        <TableCell className="font-medium">
                          {token.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {t('workerTokens.prefixValue', {
                            prefix: token.prefix,
                          })}
                        </TableCell>
                        <TableCell>{formatDate(token.createdAt)}</TableCell>
                        <TableCell>
                          {token.lastSeenAt ? (
                            <span
                              title={new Date(token.lastSeenAt).toISOString()}
                            >
                              {formatDistanceToNow(new Date(token.lastSeenAt), {
                                addSuffix: true,
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {t('workerTokens.never')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {revoked ? (
                            <Badge variant="destructive">
                              {t('workerTokens.revoked')}
                            </Badge>
                          ) : online ? (
                            <Badge>
                              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1" />
                              {t('workerTokens.online')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {t('workerTokens.idle')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!revoked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => revokeMutation.mutate(token.id)}
                              disabled={revokeMutation.isPending}
                              title={t('workerTokens.revoke')}
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
        onOpenChange={open => {
          if (!open) handleCloseCreated();
          setCreateOpen(open);
        }}
      >
        <DialogContent>
          {createdToken ? (
            <>
              <DialogHeader>
                <DialogTitle>{t('workerTokens.createdTitle')}</DialogTitle>
                <DialogDescription>
                  {t('workerTokens.createdDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted font-mono text-sm break-all">
                <span className="flex-1">{createdToken}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  title={t('workerTokens.copy')}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseCreated}>
                  {t('workerTokens.done')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t('workerTokens.newTitle')}</DialogTitle>
                <DialogDescription>
                  {t('workerTokens.newDescription')}
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder={t('workerTokens.namePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
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
                  {t('common:actions.cancel')}
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!name.trim() || createMutation.isPending}
                >
                  {t('common:actions.create')}
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
