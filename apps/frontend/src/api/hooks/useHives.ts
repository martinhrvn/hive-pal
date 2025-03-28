import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getApiUrl } from '../client';
import {
  CreateHive,
  CreateHiveResponse,
  HiveDetailResponse,
  HiveFilter,
  HiveResponse,
  UpdateHive,
  UpdateHiveResponse,
} from 'shared-schemas';
import { useAuth } from '@/context/auth-context';
import type { UseQueryOptions } from '@tanstack/react-query';

// Query keys
const HIVES_KEYS = {
  all: ['hives'] as const,
  lists: () => [...HIVES_KEYS.all, 'list'] as const,
  list: (filters: HiveFilter | undefined) =>
    [...HIVES_KEYS.lists(), filters] as const,
  details: () => [...HIVES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...HIVES_KEYS.details(), id] as const,
};

// Get all hives with optional filtering
export const useHives = (
  filters?: HiveFilter,
  queryOptions?: UseQueryOptions<HiveResponse[]>,
) => {
  return useQuery<HiveResponse[]>({
    ...queryOptions,
    queryKey: HIVES_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.apiaryId) params.append('apiaryId', filters.apiaryId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.includeInactive !== undefined)
        params.append('includeInactive', filters.includeInactive.toString());

      const url = `/hives${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<HiveResponse[]>(url);
      return response.data;
    },
    ...queryOptions,
  });
};

export const useHiveOptions = (filters?: HiveFilter) => {
  const { data, ...queryOptions } = useHives(filters);
  return {
    ...queryOptions,
    data: data?.map(hive => ({ value: hive.id, label: hive.name })),
  };
};

// Get a single hive by ID
export const useHive = (id: string, options = {}) => {
  return useQuery<HiveDetailResponse>({
    queryKey: HIVES_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<HiveDetailResponse>(`/hives/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

// Create a new hive
export const useCreateHive = (callbacks?: { onSuccess: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHive) => {
      const response = await apiClient.post<CreateHiveResponse>('/hives', data);
      return response.data;
    },
    onSuccess: async () => {
      callbacks?.onSuccess?.();
      // Invalidate hive lists to refresh data
      await queryClient.invalidateQueries({
        queryKey: HIVES_KEYS.lists(),
      });
    },
  });
};

// Update an existing hive
export const useUpdateHive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHive }) => {
      const response = await apiClient.patch<UpdateHiveResponse>(
        `/hives/${id}`,
        data,
      );

      return response.data;
    },
    onSuccess: async (_data, variables) => {
      // Invalidate the specific hive and all lists
      await queryClient.invalidateQueries({
        queryKey: HIVES_KEYS.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: HIVES_KEYS.lists(),
      });
    },
  });
};

// Delete a hive
export const useDeleteHive = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(getApiUrl(`/hives/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete hive with id ${id}`);
      }

      return id;
    },
    onSuccess: async () => {
      // Remove from cache and invalidate lists
      queryClient.invalidateQueries({ queryKey: HIVES_KEYS.lists() });
    },
  });
};
