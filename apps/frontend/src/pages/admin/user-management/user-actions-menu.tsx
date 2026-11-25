import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Ban,
  KeyRound,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCheck,
} from 'lucide-react';
import type { AdminUser } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type UserMenuTarget = Pick<
  AdminUser,
  'id' | 'email' | 'role' | 'banned'
>;

export type UserAction =
  'resetPassword' | 'toggleRole' | 'ban' | 'unban' | 'delete';

interface UserActionsMenuProps {
  readonly user: UserMenuTarget;
  /** The signed-in admin: role, ban and delete don't apply to yourself. */
  readonly isSelf: boolean;
  readonly onSelect: (action: UserAction, user: UserMenuTarget) => void;
  /** Extra items shown first, e.g. a link to the user's detail page. */
  readonly children?: ReactNode;
}

/** The per-user dropdown; `useUserActions` decides what each entry does. */
export function UserActionsMenu({
  user,
  isSelf,
  onSelect,
  children,
}: UserActionsMenuProps) {
  const { t } = useTranslation('admin');
  const [RoleIcon, roleLabel] =
    user.role === 'ADMIN'
      ? [ShieldOff, t('users.actions.makeUser')]
      : [ShieldCheck, t('users.actions.makeAdmin')];
  const [BanIcon, banAction, banLabel] = user.banned
    ? [UserCheck, 'unban' as const, t('users.actions.unban')]
    : [Ban, 'ban' as const, t('users.actions.ban')];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('users.actions.menu', { email: user.email })}
          data-test="user-actions-trigger"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {children}
        <DropdownMenuItem onSelect={() => onSelect('resetPassword', user)}>
          <KeyRound aria-hidden />
          {t('actions.resetPassword')}
        </DropdownMenuItem>
        {!isSelf && (
          <>
            <DropdownMenuItem onSelect={() => onSelect('toggleRole', user)}>
              <RoleIcon aria-hidden />
              {roleLabel}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSelect(banAction, user)}>
              <BanIcon aria-hidden />
              {banLabel}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onSelect('delete', user)}
            >
              <Trash2 aria-hidden />
              {t('users.actions.delete')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
