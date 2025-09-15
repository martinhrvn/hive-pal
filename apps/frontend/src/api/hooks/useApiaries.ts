import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getApiUrl } from '../client';
import { CreateApiary, UpdateApiary, ApiaryResponse } from 'shared-schemas';
import { useAuth } from '@/context/auth-context';
import type { UseQueryOptions } from '@tanstack/react-query';
import { logApiError } from '../errorLogger';

// Query keys
const APIARIES_KEYS = {
  all: ['apiaries'] as const,
  lists: () => [...APIARIES_KEYS.all, 'list'] as const,
  list: () => [...APIARIES_KEYS.lists()] as const,
  details: () => [...APIARIES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...APIARIES_KEYS.details(), id] as const,
};

// Get all apiaries
export const useApiaries = (
  queryOptions?: UseQueryOptions<ApiaryResponse[]>,
) => {
  return useQuery<ApiaryResponse[]>({
    queryKey: APIARIES_KEYS.list(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiaryResponse[]>('/api/apiaries');
        return response.data;
      } catch (error) {
        logApiError(error, '/api/apiaries', 'GET');
        throw error;
      }
    },
    ...queryOptions,
  });
};

export const useApiaryOptions = () => {
  const { data, ...queryOptions } = useApiaries();
  return {
    ...queryOptions,
    data: data?.map(apiary => ({ value: apiary.id, label: apiary.name })),
  };
};

// Get a single apiary by ID
export const useApiary = (id: string, options = {}) => {
  return useQuery<ApiaryResponse>({
    queryKey: APIARIES_KEYS.detail(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiaryResponse>(
          `/api/apiaries/${id}`,
        );
        return response.data;
      } catch (error) {
        logApiError(error, `/api/apiaries/${id}`, 'GET');
        throw error;
      }
    },
    enabled: !!id,
    ...options,
  });
};

// Create a new apiary
export const useCreateApiary = (callbacks?: { onSuccess: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApiary) => {
      const response = await apiClient.post<ApiaryResponse>(
        '/api/apiaries',
        data,
      );
      return response.data;
    },
    onSuccess: async () => {
      callbacks?.onSuccess?.();
      // Invalidate apiary lists to refresh data
      await queryClient.invalidateQueries({
        queryKey: APIARIES_KEYS.lists(),
      });
    },
    onError: error => {
      logApiError(error, '/api/apiaries', 'POST');
    },
  });
};

// Update an existing apiary
export const useUpdateApiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateApiary }) => {
      const response = await apiClient.patch<ApiaryResponse>(
        `/api/apiaries/${id}`,
        data,
      );

      return response.data;
    },
    onSuccess: async (_data, variables) => {
      // Invalidate the specific apiary and all lists
      await queryClient.invalidateQueries({
        queryKey: APIARIES_KEYS.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: APIARIES_KEYS.lists(),
      });
    },
    onError: (error, variables) => {
      logApiError(error, `/api/apiaries/${variables.id}`, 'PATCH');
    },
  });
};

// Delete an apiary
export const useDeleteApiary = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(getApiUrl(`/api/apiaries/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const error = new Error(`Failed to delete apiary with id ${id}`);
        logApiError(error, `/api/apiaries/${id}`, 'DELETE');
        throw error;
      }

      return id;
    },
    onSuccess: async () => {
      // Remove from cache and invalidate lists
      queryClient.invalidateQueries({ queryKey: APIARIES_KEYS.lists() });
    },
  });
};
