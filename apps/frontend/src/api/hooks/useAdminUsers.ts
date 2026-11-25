import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  AdminCreateUser,
  AdminUser,
  AdminUserCapabilities,
  AdminUserListParams,
  AdminUserListResponse,
  UserDetailedStats,
  UserRole,
} from 'shared-schemas';
import { apiClient } from '../client';
import { logApiError } from '../errorLogger';
import { authClient } from '@/lib/auth-client';

export const ADMIN_USERS_KEYS = {
  all: ['admin', 'users'] as const,
  lists: () => [...ADMIN_USERS_KEYS.all, 'list'] as const,
  list: (params: AdminUserListParams) =>
    [...ADMIN_USERS_KEYS.lists(), params] as const,
  capabilities: () => [...ADMIN_USERS_KEYS.all, 'capabilities'] as const,
  details: () => [...ADMIN_USERS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ADMIN_USERS_KEYS.details(), id] as const,
  account: (id: string) => [...ADMIN_USERS_KEYS.detail(id), 'account'] as const,
  stats: (id: string) => [...ADMIN_USERS_KEYS.detail(id), 'stats'] as const,
};

async function get<T>(url: string, params?: object): Promise<T> {
  try {
    const response = await apiClient.get<T>(url, { params });
    return response.data;
  } catch (error) {
    logApiError(error, url, 'GET');
    throw error;
  }
}

/**
 * Better Auth's client reports failures in `error` instead of throwing; turn
 * that into a rejected promise so React Query treats it as a failed mutation.
 * Its messages are English-only: callers show their own translated message
 * and keep this one for logs.
 */
async function unwrapAuth<T>(
  call: Promise<{ data: T | null; error: { message?: string } | null }>,
): Promise<T> {
  const { data, error } = await call;
  if (error) {
    throw new Error(error.message || 'Better Auth admin request failed', {
      cause: error,
    });
  }
  return data as T;
}

/** Search, filter and page through users with their summary stats. */
export const useAdminUsers = (params: AdminUserListParams) =>
  useQuery({
    queryKey: ADMIN_USERS_KEYS.list(params),
    queryFn: () => get<AdminUserListResponse>('/api/users', params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

/** Instance settings that shape user management (mail, registration). */
export const useAdminUserCapabilities = () =>
  useQuery({
    queryKey: ADMIN_USERS_KEYS.capabilities(),
    queryFn: () => get<AdminUserCapabilities>('/api/users/admin/capabilities'),
    staleTime: 5 * 60_000,
  });

export const useAdminUser = (userId: string | undefined) =>
  useQuery({
    queryKey: ADMIN_USERS_KEYS.account(userId ?? ''),
    queryFn: () => get<AdminUser>(`/api/users/${userId}/account`),
    enabled: !!userId,
    staleTime: 30_000,
  });

export const useUserDetailedStats = (userId: string | undefined) =>
  useQuery({
    queryKey: ADMIN_USERS_KEYS.stats(userId ?? ''),
    queryFn: () => get<UserDetailedStats>(`/api/users/${userId}/stats`),
    enabled: !!userId,
    staleTime: 30_000,
  });

/**
 * Refresh the lists and the touched user without awaiting it: a mutation that
 * waited for the refetch would settle only after its row may have unmounted
 * (deleted, or filtered out), so the caller's success toast would be lost.
 */
const useRefreshUsers = () => {
  const queryClient = useQueryClient();
  return (userId?: string) => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEYS.lists() });
    if (userId) {
      void queryClient.invalidateQueries({
        queryKey: ADMIN_USERS_KEYS.detail(userId),
      });
    }
  };
};

export const useCreateUser = () => {
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: async (input: AdminCreateUser) => {
      const response = await apiClient.post<AdminUser>('/api/users', input);
      return response.data;
    },
    onSuccess: () => refresh(),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/api/users/${userId}`);
    },
    onSuccess: (_, userId) => {
      // The user is gone: drop their detail queries instead of refetching
      // them into a 404.
      queryClient.removeQueries({ queryKey: ADMIN_USERS_KEYS.detail(userId) });
      refresh();
    },
  });
};

export const useResetUserPassword = () => {
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => unwrapAuth(authClient.admin.setUserPassword({ userId, newPassword })),
    onSuccess: (_, { userId }) => refresh(userId),
  });
};

export const useSetUserRole = () => {
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      // Hive Pal's roles are upper-case; Better Auth's client types only list
      // its default lower-case ones.
      unwrapAuth(
        authClient.admin.setRole({ userId, role: role as 'admin' | 'user' }),
      ),
    onSuccess: (_, { userId }) => refresh(userId),
  });
};

export const useBanUser = () => {
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      unwrapAuth(
        authClient.admin.banUser({ userId, banReason: reason || undefined }),
      ),
    onSuccess: (_, { userId }) => refresh(userId),
  });
};

export const useUnbanUser = () => {
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: (userId: string) =>
      unwrapAuth(authClient.admin.unbanUser({ userId })),
    onSuccess: (_, userId) => refresh(userId),
  });
};
