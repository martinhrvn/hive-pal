import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getApiUrl } from '../client';
import { CreateQueen, UpdateQueen, QueenResponse } from 'shared-schemas';
import { useAuth } from '@/context/auth-context';
import type { UseQueryOptions } from '@tanstack/react-query';

// Query keys
const QUEENS_KEYS = {
  all: ['queens'] as const,
  lists: () => [...QUEENS_KEYS.all, 'list'] as const,
  list: (hiveId?: string) => [...QUEENS_KEYS.lists(), { hiveId }] as const,
  details: () => [...QUEENS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUEENS_KEYS.details(), id] as const,
};

// Get all queens with optional hive filter
export const useQueens = (
  hiveId?: string,
  queryOptions?: UseQueryOptions<QueenResponse[]>,
) => {
  return useQuery<QueenResponse[]>({
    queryKey: QUEENS_KEYS.list(hiveId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (hiveId) params.append('hiveId', hiveId);

      const url = `/api/queens${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<QueenResponse[]>(url);
      return response.data;
    },
    ...queryOptions,
  });
};

// Get a single queen by ID
export const useQueen = (id: string, options = {}) => {
  return useQuery<QueenResponse>({
    queryKey: QUEENS_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<QueenResponse>(`/api/queens/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

// Create a new queen
export const useCreateQueen = (callbacks?: { onSuccess: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQueen) => {
      const response = await apiClient.post<QueenResponse>('/api/queens', data);
      return response.data;
    },
    onSuccess: async data => {
      callbacks?.onSuccess?.();
      // Invalidate queen lists to refresh data
      await queryClient.invalidateQueries({
        queryKey: QUEENS_KEYS.lists(),
      });
      // If the queen is associated with a hive, invalidate that hive
      if (data.hiveId) {
        await queryClient.invalidateQueries({
          queryKey: ['hives', 'detail', data.hiveId],
        });
      }
    },
  });
};

// Update an existing queen
export const useUpdateQueen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQueen }) => {
      const response = await apiClient.patch<QueenResponse>(
        `/api/queens/${id}`,
        data,
      );

      return response.data;
    },
    onSuccess: async (data, variables) => {
      // Invalidate the specific queen and all lists
      await queryClient.invalidateQueries({
        queryKey: QUEENS_KEYS.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: QUEENS_KEYS.lists(),
      });
      // If the queen is associated with a hive, invalidate that hive
      if (data.hiveId) {
        await queryClient.invalidateQueries({
          queryKey: ['hives', 'detail', data.hiveId],
        });
      }
    },
  });
};

// Delete a queen
export const useDeleteQueen = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(getApiUrl(`/api/queens/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete queen with id ${id}`);
      }

      return id;
    },
    onSuccess: async () => {
      // Remove from cache and invalidate lists
      queryClient.invalidateQueries({ queryKey: QUEENS_KEYS.lists() });
    },
  });
};
