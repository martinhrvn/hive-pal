import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { AdminUserWithStats } from 'shared-schemas';
import type { DataTableColumn } from '@/components/data-table';
import { StatusPill } from '@/components/common/status-pill';
import { RolePill, UserStatusPill } from './user-pills';
import { Eye } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  UserActionsMenu,
  type UserAction,
  type UserMenuTarget,
} from './user-actions-menu';
import { DateCell } from './date-cell';

const NUMERIC = 'text-right tabular-nums';

/** Column definitions for the admin users table. */
export function useUserColumns(
  currentUserId: string | undefined,
  onAction: (action: UserAction, user: UserMenuTarget) => void,
): DataTableColumn<AdminUserWithStats>[] {
  const { t } = useTranslation('admin');
  return useMemo(
    () => [
      {
        id: 'user',
        header: t('users.table.user'),
        canHide: false,
        cell: user => (
          <div className="flex min-w-0 flex-col">
            <Link
              to={`/admin/users/${user.id}`}
              className="truncate font-medium hover:underline"
            >
              {user.name || user.email}
            </Link>
            <span className="truncate text-sm text-muted-foreground">
              {user.email}
            </span>
          </div>
        ),
      },
      {
        id: 'role',
        header: t('table.role'),
        cell: user => (
          <div className="flex items-center gap-1.5">
            <RolePill role={user.role} />
            {user.id === currentUserId && (
              <StatusPill size="sm">{t('users.you')}</StatusPill>
            )}
          </div>
        ),
      },
      {
        id: 'status',
        header: t('table.status'),
        cell: user => <UserStatusPill user={user} />,
      },
      {
        id: 'apiaries',
        header: t('table.apiaries'),
        headerClassName: 'text-right',
        cellClassName: NUMERIC,
        cell: user => user.stats.apiariesCount,
      },
      {
        id: 'hives',
        header: t('table.hives'),
        headerClassName: 'text-right',
        cellClassName: NUMERIC,
        cell: user => user.stats.hivesCount,
      },
      {
        id: 'inspections',
        header: t('table.inspections'),
        headerClassName: 'text-right',
        cellClassName: NUMERIC,
        cell: user => user.stats.inspectionsCount,
      },
      {
        id: 'lastLogin',
        header: t('users.table.lastLogin'),
        cellClassName: 'whitespace-nowrap text-muted-foreground',
        cell: user => (
          <DateCell
            value={user.lastLoginAt}
            withTime
            fallback={t('users.table.never')}
          />
        ),
      },
      {
        id: 'lastActivity',
        header: t('table.lastActivity'),
        defaultHidden: true,
        cellClassName: 'whitespace-nowrap text-muted-foreground',
        cell: user => <DateCell value={user.stats.lastActivityDate} />,
      },
      {
        id: 'created',
        header: t('table.created'),
        cellClassName: 'whitespace-nowrap text-muted-foreground',
        cell: user => <DateCell value={user.createdAt} />,
      },
      {
        id: 'actions',
        header: <span className="sr-only">{t('table.actions')}</span>,
        menuLabel: t('table.actions'),
        canHide: false,
        cellClassName: 'w-10 text-right',
        cell: user => (
          <UserActionsMenu
            user={user}
            isSelf={user.id === currentUserId}
            onSelect={onAction}
          >
            <DropdownMenuItem asChild>
              <Link to={`/admin/users/${user.id}`}>
                <Eye aria-hidden />
                {t('users.actions.view')}
              </Link>
            </DropdownMenuItem>
          </UserActionsMenu>
        ),
      },
    ],
    [t, currentUserId, onAction],
  );
}
