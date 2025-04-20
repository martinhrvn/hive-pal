import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ActionFilter, ActionResponse } from 'shared-schemas';
import type { UseQueryOptions } from '@tanstack/react-query';

// Query keys
const ACTIONS_KEYS = {
  all: ['actions'] as const,
  lists: () => [...ACTIONS_KEYS.all, 'list'] as const,
  list: (filters: ActionFilter | undefined) =>
    [...ACTIONS_KEYS.lists(), filters] as const,
  details: () => [...ACTIONS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ACTIONS_KEYS.details(), id] as const,
};

// Get all actions with optional filtering
export const useActions = (
  filters?: ActionFilter,
  queryOptions?: UseQueryOptions<ActionResponse[]>,
) => {
  return useQuery<ActionResponse[]>({
    queryKey: ACTIONS_KEYS.list(filters),
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
