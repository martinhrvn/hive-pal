import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useApiaryInvites,
  useCreateApiaryInvite,
  useRevokeApiaryInvite,
  useApiaryMembers,
  useUpdateApiaryMember,
  useRemoveApiaryMember,
} from '@/api/hooks';
import { useDateFormat } from '@/hooks/use-date-format';
import {
  Link2,
  Copy,
  Check,
  Trash2,
  UserPlus,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import type { ApiaryRole } from 'shared-schemas';

interface SharingTabProps {
  apiaryId: string;
}

export function SharingTab({ apiaryId }: SharingTabProps) {
  return (
    <div className="space-y-6">
      <InviteLinksSection apiaryId={apiaryId} />
      <MembersSection apiaryId={apiaryId} />
    </div>
  );
}

function InviteLinksSection({ apiaryId }: { apiaryId: string }) {
  const { t } = useTranslation('apiary');
  const { formatDate } = useDateFormat();
  const { data: invites = [], isLoading } = useApiaryInvites(apiaryId);
  const createInvite = useCreateApiaryInvite();
  const revokeInvite = useRevokeApiaryInvite();
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = async () => {
    await createInvite.mutateAsync({ apiaryId, data: { role } });
    setDialogOpen(false);
  };

  const handleCopy = async (token: string, id: string) => {
    const url = `${window.location.origin}/join/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {t('sharing.inviteLinks.title')}
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Link2 className="h-4 w-4 mr-2" />
              {t('sharing.inviteLinks.createLink')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('sharing.inviteLinks.dialogTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('sharing.inviteLinks.permissionLevel')}
                </label>
                <Select
                  value={role}
                  onValueChange={v => setRole(v as 'EDITOR' | 'VIEWER')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">{t('roles.VIEWER')}</SelectItem>
                    <SelectItem value="EDITOR">{t('roles.EDITOR')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {role === 'VIEWER'
                    ? t('sharing.inviteLinks.viewerHint')
                    : t('sharing.inviteLinks.editorHint')}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createInvite.isPending}
              >
                {createInvite.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t('sharing.inviteLinks.createLink')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : invites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('sharing.inviteLinks.empty')}
          </p>
        ) : (
          <div className="space-y-3">
            {invites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <RoleBadge role={invite.role} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(invite.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(invite.token, invite.id)}
                  >
                    {copiedId === invite.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() =>
                      revokeInvite.mutate({
                        apiaryId,
                        inviteId: invite.id,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MembersSection({ apiaryId }: { apiaryId: string }) {
  const { t } = useTranslation('apiary');
  const { data: members = [], isLoading } = useApiaryMembers(apiaryId);
  const updateMember = useUpdateApiaryMember();
  const removeMember = useRemoveApiaryMember();

  const pendingMembers = members.filter(m => m.status === 'PENDING');
  const activeMembers = members.filter(m => m.status === 'ACTIVE');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('sharing.members.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('sharing.members.empty')}
          </p>
        ) : (
          <div className="space-y-4">
            {pendingMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {t('sharing.members.pending', {
                    total: pendingMembers.length,
                  })}
                </h4>
                <div className="space-y-2">
                  {pendingMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {member.userName || member.userEmail}
                        </div>
                        {member.userName && (
                          <div className="text-xs text-muted-foreground">
                            {member.userEmail}
                          </div>
                        )}
                        <RoleBadge role={member.role} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600"
                          onClick={() =>
                            updateMember.mutate({
                              apiaryId,
                              memberId: member.id,
                              data: { status: 'ACTIVE' },
                            })
                          }
                          disabled={updateMember.isPending}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          {t('sharing.members.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive"
                          onClick={() =>
                            updateMember.mutate({
                              apiaryId,
                              memberId: member.id,
                              data: { status: 'REJECTED' },
                            })
                          }
                          disabled={updateMember.isPending}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          {t('sharing.members.reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {t('sharing.members.active', { total: activeMembers.length })}
                </h4>
                <div className="space-y-2">
                  {activeMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {member.userName || member.userEmail}
                        </div>
                        {member.userName && (
                          <div className="text-xs text-muted-foreground">
                            {member.userEmail}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <RoleBadge role={member.role} />
                          <Select
                            value={member.role}
                            onValueChange={v =>
                              updateMember.mutate({
                                apiaryId,
                                memberId: member.id,
                                data: { role: v as 'EDITOR' | 'VIEWER' },
                              })
                            }
                          >
                            <SelectTrigger className="h-7 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VIEWER">
                                {t('roles.VIEWER')}
                              </SelectItem>
                              <SelectItem value="EDITOR">
                                {t('roles.EDITOR')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() =>
                          removeMember.mutate({
                            apiaryId,
                            memberId: member.id,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RoleBadge({ role }: { role: ApiaryRole }) {
  const { t } = useTranslation('apiary');
  if (role === 'EDITOR') {
    return (
      <Badge variant="default" className="text-xs">
        <UserPlus className="h-3 w-3 mr-1" />
        {t('roles.EDITOR')}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      {t('roles.VIEWER')}
    </Badge>
  );
}
