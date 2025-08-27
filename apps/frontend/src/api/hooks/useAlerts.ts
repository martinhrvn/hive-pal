import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  AlertResponse,
  AlertFilter,
  UpdateAlert,
} from 'shared-schemas';
import type { UseQueryOptions } from '@tanstack/react-query';

// Query keys
const ALERTS_KEYS = {
  all: ['alerts'] as const,
  lists: () => [...ALERTS_KEYS.all, 'list'] as const,
  list: (filters: AlertFilter | undefined) =>
    [...ALERTS_KEYS.lists(), filters] as const,
  details: () => [...ALERTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ALERTS_KEYS.details(), id] as const,
};

// Get all alerts with optional filtering
export const useAlerts = (
  filters?: AlertFilter,
  queryOptions?: UseQueryOptions<AlertResponse[]>,
) => {
  return useQuery<AlertResponse[]>({
    ...queryOptions,
    queryKey: ALERTS_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hiveId) params.append('hiveId', filters.hiveId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.includeSuperseded !== undefined)
        params.append('includeSuperseded', filters.includeSuperseded.toString());

      const url = `/api/alerts${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<AlertResponse[]>(url);
      return response.data;
    },
    ...queryOptions,
  });
};

// Get a single alert by ID
export const useAlert = (id: string, options = {}) => {
  return useQuery<AlertResponse>({
    queryKey: ALERTS_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<AlertResponse>(`/api/alerts/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

// Update an alert (for status changes)
export const useUpdateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAlert }) => {
      const response = await apiClient.patch<AlertResponse>(
        `/api/alerts/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: async (_data, variables) => {
      // Invalidate the specific alert and all lists
      await queryClient.invalidateQueries({
        queryKey: ALERTS_KEYS.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: ALERTS_KEYS.lists(),
      });
      // Also invalidate hives since they include alerts
      await queryClient.invalidateQueries({
        queryKey: ['hives'],
      });
    },
  });
};

// Dismiss an alert
export const useDismissAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<AlertResponse>(
        `/api/alerts/${id}/dismiss`,
      );
      return response.data;
    },
    onSuccess: async () => {
      // Invalidate all alert and hive queries
      await queryClient.invalidateQueries({
        queryKey: ALERTS_KEYS.all,
      });
      await queryClient.invalidateQueries({
        queryKey: ['hives'],
      });
    },
  });
};

// Resolve an alert
export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<AlertResponse>(
        `/api/alerts/${id}/resolve`,
      );
      return response.data;
    },
    onSuccess: async () => {
      // Invalidate all alert and hive queries
      await queryClient.invalidateQueries({
        queryKey: ALERTS_KEYS.all,
      });
      await queryClient.invalidateQueries({
        queryKey: ['hives'],
      });
    },
  });
};

// Trigger manual alert check (admin/testing)
export const useTriggerAlertCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/alerts/check');
      return response.data;
    },
    onSuccess: async () => {
      // Invalidate all alert and hive queries to refresh data
      await queryClient.invalidateQueries({
        queryKey: ALERTS_KEYS.all,
      });
      await queryClient.invalidateQueries({
        queryKey: ['hives'],
      });
    },
  });
};