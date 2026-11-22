import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import type { AdminUserStatus, UserRole } from 'shared-schemas';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserListFilters } from './use-user-list-params';

const ALL = 'all';

interface UsersToolbarProps {
  readonly filters: UserListFilters;
  readonly onFiltersChange: (patch: Partial<UserListFilters>) => void;
  /** Trailing controls, e.g. the column visibility menu. */
  readonly children?: ReactNode;
}

export function UsersToolbar({
  filters,
  onFiltersChange,
  children,
}: UsersToolbarProps) {
  const { t } = useTranslation('admin');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={filters.search}
        onCommit={search => onFiltersChange({ search })}
      />
      <Select
        value={filters.role ?? ALL}
        onValueChange={value =>
          onFiltersChange({
            role: value === ALL ? undefined : (value as UserRole),
          })
        }
      >
        <SelectTrigger
          className="w-36"
          aria-label={t('table.role')}
          data-test="users-role-filter"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('users.filters.allRoles')}</SelectItem>
          <SelectItem value="USER">{t('users.roles.USER')}</SelectItem>
          <SelectItem value="ADMIN">{t('users.roles.ADMIN')}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.status ?? ALL}
        onValueChange={value =>
          onFiltersChange({
            status: value === ALL ? undefined : (value as AdminUserStatus),
          })
        }
      >
        <SelectTrigger
          className="w-36"
          aria-label={t('table.status')}
          data-test="users-status-filter"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('users.filters.allStatuses')}</SelectItem>
          <SelectItem value="active">{t('users.status.active')}</SelectItem>
          <SelectItem value="banned">{t('users.status.banned')}</SelectItem>
        </SelectContent>
      </Select>
      {children && <div className="ml-auto">{children}</div>}
    </div>
  );
}

/**
 * Search box that commits after a short pause in typing. A value changed from
 * outside (e.g. "clear filters") replaces whatever is in the box.
 */
function SearchInput({
  value,
  onCommit,
}: Readonly<{ value: string; onCommit: (value: string) => void }>) {
  const { t } = useTranslation('admin');
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  // The latest onCommit without restarting the timer when the parent
  // re-renders (its setter changes with every URL update).
  const commit = useEffectEvent(onCommit);
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => commit(draft), 300);
    return () => clearTimeout(timer);
  }, [draft, value]);

  return (
    <div className="relative w-full sm:w-72">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={t('users.searchPlaceholder')}
        aria-label={t('users.searchLabel')}
        className="pl-8"
        data-test="users-search"
      />
    </div>
  );
}
