import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { UserPlus, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { ApiaryMember, ApiaryMemberRole, InviteMember } from 'shared-schemas';
import {
  useApiaryMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useUserProfile,
} from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiaryMembersTabProps {
  apiaryId: string;
}

const ROLE_LABELS: Record<ApiaryMemberRole, string> = {
  OWNER: 'Owner',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
};

const ROLE_BADGE_VARIANT: Record<ApiaryMemberRole, 'default' | 'secondary' | 'outline'> = {
  OWNER: 'default',
  EDITOR: 'secondary',
  VIEWER: 'outline',
};

function MemberRow({
  member,
  isCurrentUser,
  canManage,
  showEmail,
  apiaryId,
}: Readonly<{
  member: ApiaryMember;
  isCurrentUser: boolean;
  canManage: boolean;
  showEmail: boolean;
  apiaryId: string;
}>) {
  const updateRole = useUpdateMemberRole(apiaryId);
  const removeMember = useRemoveMember(apiaryId);
  const isPending = !member.acceptedAt;

  const handleRoleChange = async (role: string) => {
    try {
      await updateRole.mutateAsync({
        userId: member.userId,
        data: { role: role as 'EDITOR' | 'VIEWER' },
      });
      toast.success(`Role updated to ${ROLE_LABELS[role as ApiaryMemberRole]}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync(member.userId);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const displayName = member.user.name || member.user.email;

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
          {displayName[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{displayName}</span>
            {isCurrentUser && (
              <span className="text-xs text-muted-foreground">(you)</span>
            )}
          </div>
          {showEmail && (
              <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
            )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        {isPending ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        )}

        {canManage && member.role !== 'OWNER' ? (
          <>
            <Select
              value={member.role}
              onValueChange={handleRoleChange}
              disabled={updateRole.isPending}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">Editor</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  disabled={removeMember.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove member</AlertDialogTitle>
                  <AlertDialogDescription>
                    Remove <strong>{displayName}</strong> from this apiary? They will lose access immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemove}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <Badge variant={ROLE_BADGE_VARIANT[member.role]}>
            {ROLE_LABELS[member.role]}
          </Badge>
        )}
      </div>
    </div>
  );
}

function InviteMemberDialog({ apiaryId }: Readonly<{ apiaryId: string }>) {
  const [open, setOpen] = useState(false);
  const inviteMember = useInviteMember(apiaryId);
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } =
    useForm<InviteMember>({ defaultValues: { role: 'VIEWER' } });

  const role = watch('role');

  const onSubmit = async (data: InviteMember) => {
    try {
      await inviteMember.mutateAsync(data);
      toast.success(`Invitation sent to ${data.email}`);
      reset();
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send invitation';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={v => setValue('role', v as 'EDITOR' | 'VIEWER')}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">
                  <div>
                    <div className="font-medium">Editor</div>
                    <div className="text-xs text-muted-foreground">Can add inspections and manage hives</div>
                  </div>
                </SelectItem>
                <SelectItem value="VIEWER">
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-xs text-muted-foreground">Can view data only</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? 'Sending...' : 'Send invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ApiaryMembersTab({ apiaryId }: Readonly<ApiaryMembersTabProps>) {
  const { data: members, isLoading } = useApiaryMembers(apiaryId);
  const { data: currentUser } = useUserProfile();

  const currentMember = members?.find(m => m.userId === currentUser?.id);
  const isOwner = currentMember?.role === 'OWNER';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading members...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Members</h3>
          <p className="text-sm text-muted-foreground">
            {members?.length === 1 ? 'member' : `${members?.length ?? 0} members`}
          </p>
        </div>
        {isOwner && <InviteMemberDialog apiaryId={apiaryId} />}
      </div>

      <div className="rounded-md border bg-card px-4">
        {members && members.length > 0 ? (
          members.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              isCurrentUser={member.userId === currentUser?.id}
              canManage={isOwner}
              showEmail={isOwner}
              apiaryId={apiaryId}
            />
          ))
        ) : (
          <p className="py-8 text-center text-muted-foreground">No members yet.</p>
        )}
      </div>
    </div>
  );
}
