import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { apiErrorMessage } from '@/api/api-error-message';
import {
  useBanUser,
  useDeleteUser,
  useResetUserPassword,
  useSetUserRole,
  useUnbanUser,
} from '@/api/hooks/useAdminUsers';
import { BanUserDialog } from './ban-user-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';
import type { UserAction, UserMenuTarget } from './user-actions-menu';

type DialogAction = Extract<UserAction, 'resetPassword' | 'ban' | 'delete'>;
type Pending = { action: DialogAction; user: UserMenuTarget };

interface UseUserActionsOptions {
  /** Called after a user was deleted, e.g. to leave their detail page. */
  readonly onDeleted?: () => void;
}

/**
 * Runs the admin actions offered by {@link UserActionsMenu}: role and unban
 * apply right away, the rest go through one shared set of dialogs. Render
 * `dialogs` once per page and pass `openAction` to every menu.
 *
 * Mutations go through `mutateAsync().then(...)` so the toast still fires
 * when the acted-on row unmounts (deleted, or no longer matching a filter).
 */
export function useUserActions({ onDeleted }: UseUserActionsOptions = {}) {
  const { t } = useTranslation('admin');
  const [pending, setPending] = useState<Pending | null>(null);
  const { mutateAsync: resetPassword, isPending: resetting } =
    useResetUserPassword();
  const { mutateAsync: setRole } = useSetUserRole();
  const { mutateAsync: ban, isPending: banning } = useBanUser();
  const { mutateAsync: unban } = useUnbanUser();
  const { mutateAsync: remove, isPending: removing } = useDeleteUser();

  const fail = useCallback(
    (error: unknown) =>
      toast.error(apiErrorMessage(error, t('messages.unexpectedError'))),
    [t],
  );
  const close = () => setPending(null);
  const closeOnDismiss = (open: boolean) => {
    if (!open) close();
  };

  const openAction = useCallback(
    (action: UserAction, user: UserMenuTarget) => {
      if (action === 'toggleRole') {
        const role = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        void setRole({ userId: user.id, role }).then(
          () =>
            toast.success(
              t('users.toasts.roleChanged', {
                email: user.email,
                role: t(`users.roles.${role}`),
              }),
            ),
          fail,
        );
      } else if (action === 'unban') {
        void unban(user.id).then(
          () =>
            toast.success(t('users.toasts.unbanned', { email: user.email })),
          fail,
        );
      } else {
        setPending({ action, user });
      }
    },
    [setRole, unban, fail, t],
  );

  const user = pending?.user;
  const dialogs = user && (
    <>
      {pending.action === 'resetPassword' && (
        <ResetPasswordDialog
          open
          email={user.email}
          onOpenChange={closeOnDismiss}
          isPending={resetting}
          onReset={newPassword =>
            resetPassword({ userId: user.id, newPassword }).then(() => {
              toast.success(t('messages.resetSuccess'));
              close();
            }, fail)
          }
        />
      )}
      {pending.action === 'ban' && (
        <BanUserDialog
          open
          email={user.email}
          onOpenChange={closeOnDismiss}
          isPending={banning}
          onBan={reason =>
            ban({ userId: user.id, reason }).then(() => {
              toast.success(t('users.toasts.banned', { email: user.email }));
              close();
            }, fail)
          }
        />
      )}
      {pending.action === 'delete' && (
        <DeleteConfirmDialog
          open
          onOpenChange={closeOnDismiss}
          isPending={removing}
          title={t('users.delete.title', { email: user.email })}
          description={t('users.delete.description')}
          onConfirm={() =>
            remove(user.id).then(() => {
              toast.success(t('users.toasts.deleted', { email: user.email }));
              close();
              onDeleted?.();
            }, fail)
          }
        />
      )}
    </>
  );

  return { openAction, dialogs };
}
