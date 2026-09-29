import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { apiaryHeaderConfig } from './useHives';
import {
  ActionFilter,
  ActionResponse,
  CreateStandaloneAction,
  UpdateAction,
} from 'shared-schemas';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useApiaryStore } from '@/hooks/use-apiary';

// Query keys
const ACTIONS_KEYS = {
  all: ['actions'] as const,
  lists: () => [...ACTIONS_KEYS.all, 'list'] as const,
  // The apiary scope ('all' or a concrete id) is part of the key: the query
  // cache is persisted, so a cross-apiary result must never be served for a
  // single apiary (or vice versa).
  list: (scope: string | null, filters: ActionFilter | undefined) =>
    [...ACTIONS_KEYS.lists(), scope, filters] as const,
  details: () => [...ACTIONS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ACTIONS_KEYS.details(), id] as const,
};

// Get all actions with optional filtering
export const useActions = (
  filters?: ActionFilter,
  queryOptions?: Partial<UseQueryOptions<ActionResponse[]>>,
) => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  const viewAllApiaries = useApiaryStore(state => state.viewAllApiaries);
  const scope = viewAllApiaries ? 'all' : activeApiaryId;
  return useQuery<ActionResponse[]>({
    queryKey: ACTIONS_KEYS.list(scope, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.hiveId) params.append('hiveId', filters.hiveId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `/api/actions${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<ActionResponse[]>(url);
      return response.data;
    },
    ...queryOptions,
  });
};

// Create a new standalone action. An optional apiaryId is sent as x-apiary-id
// so the write targets the hive's own apiary in view-all mode.
export const useCreateAction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ActionResponse,
    Error,
    CreateStandaloneAction & { apiaryId?: string }
  >({
    mutationFn: async ({ apiaryId, ...data }) => {
      const response = await apiClient.post<ActionResponse>(
        '/api/actions',
        data,
        apiaryHeaderConfig(apiaryId),
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate every actions query (all scopes and hive filters)
      queryClient.invalidateQueries({
        queryKey: ACTIONS_KEYS.all,
      });
    },
  });
};

// Update an existing action
export const useUpdateAction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ActionResponse,
    Error,
    { actionId: string; data: UpdateAction }
  >({
    mutationFn: async ({ actionId, data }) => {
      const response = await apiClient.put<ActionResponse>(
        `/api/actions/${actionId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all actions queries
      queryClient.invalidateQueries({
        queryKey: ACTIONS_KEYS.all,
      });
    },
  });
};

// Delete an action
export const useDeleteAction = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (actionId: string) => {
      await apiClient.delete(`/api/actions/${actionId}`);
    },
    onSuccess: () => {
      // Invalidate all actions queries
      queryClient.invalidateQueries({
        queryKey: ACTIONS_KEYS.all,
      });
    },
  });
};
