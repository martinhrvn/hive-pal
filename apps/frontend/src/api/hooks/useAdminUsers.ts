import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { UserWithStatsResponse, UserDetailedStats } from 'shared-schemas';
import { logApiError } from '../errorLogger';

// Query keys
const ADMIN_USERS_KEYS = {
  all: ['admin', 'users'] as const,
  lists: () => [...ADMIN_USERS_KEYS.all, 'list'] as const,
  list: () => [...ADMIN_USERS_KEYS.lists()] as const,
  details: () => [...ADMIN_USERS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ADMIN_USERS_KEYS.details(), id] as const,
  stats: (id: string) => [...ADMIN_USERS_KEYS.detail(id), 'stats'] as const,
};

// Get all users with stats (admin only)
export const useAdminUsers = () => {
  return useQuery<UserWithStatsResponse[]>({
    queryKey: ADMIN_USERS_KEYS.list(),
    queryFn: async () => {
      try {
        const response =
          await apiClient.get<UserWithStatsResponse[]>('/api/users');
        return response.data;
      } catch (error) {
        logApiError(error, '/api/users', 'GET');
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
  });
};

// Get detailed stats for a single user (admin only)
export const useUserDetailedStats = (userId: string | undefined) => {
  return useQuery<UserDetailedStats>({
    queryKey: ADMIN_USERS_KEYS.stats(userId || ''),
    queryFn: async () => {
      try {
        const response = await apiClient.get<UserDetailedStats>(
          `/api/users/${userId}/stats`,
        );
        return response.data;
      } catch (error) {
        logApiError(error, `/api/users/${userId}/stats`, 'GET');
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });
};
