import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  adminUserStatusSchema,
  userRoleSchema,
  type AdminUserStatus,
  type UserRole,
} from 'shared-schemas';

export const USERS_PAGE_SIZE = 25;

export interface UserListFilters {
  search: string;
  role: UserRole | undefined;
  status: AdminUserStatus | undefined;
  page: number;
}

const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

/**
 * The users list filters, kept in the URL so a filtered view survives reloads
 * and can be linked. Changing a filter goes back to the first page.
 */
export function useUserListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<UserListFilters>(
    () => ({
      search: searchParams.get('q') ?? '',
      role: userRoleSchema.safeParse(searchParams.get('role')).data,
      status: adminUserStatusSchema.safeParse(searchParams.get('status')).data,
      page: parsePage(searchParams.get('page')),
    }),
    [searchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<UserListFilters>) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          const set = (key: string, value: string | number | undefined) => {
            if (value === undefined || value === '' || value === 1) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          };
          if ('search' in patch) set('q', patch.search);
          if ('role' in patch) set('role', patch.role);
          if ('status' in patch) set('status', patch.status);
          set('page', 'page' in patch ? patch.page : undefined);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const hasFilters = !!(filters.search || filters.role || filters.status);

  return { filters, setFilters, hasFilters };
}
