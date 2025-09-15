import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  CreateHarvest,
  UpdateHarvest,
  SetHarvestWeight,
  HarvestResponse,
  HarvestListResponse,
  HarvestFilter,
} from 'shared-schemas';
import type { UseQueryOptions } from '@tanstack/react-query';

// Query keys
const HARVESTS_KEYS = {
  all: ['harvests'] as const,
  lists: () => [...HARVESTS_KEYS.all, 'list'] as const,
  list: (filters: HarvestFilter | undefined) =>
    [...HARVESTS_KEYS.lists(), filters] as const,
  details: () => [...HARVESTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...HARVESTS_KEYS.details(), id] as const,
};

// Get all harvests with optional filtering
export const useHarvests = (
  filters?: HarvestFilter,
  queryOptions?: UseQueryOptions<HarvestListResponse[]>,
) => {
  return useQuery<HarvestListResponse[]>({
    queryKey: HARVESTS_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.apiaryId) params.append('apiaryId', filters.apiaryId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `/api/harvests${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<HarvestListResponse[]>(url);
      return response.data;
    },
    ...queryOptions,
  });
};

// Get a single harvest
export const useHarvest = (
  harvestId: string,
  queryOptions?: UseQueryOptions<HarvestResponse>,
) => {
  return useQuery<HarvestResponse>({
    queryKey: HARVESTS_KEYS.detail(harvestId),
    queryFn: async () => {
      const response = await apiClient.get<HarvestResponse>(
        `/api/harvests/${harvestId}`,
      );
      return response.data;
    },
    enabled: !!harvestId,
    ...queryOptions,
  });
};

// Create a new harvest
export const useCreateHarvest = () => {
  const queryClient = useQueryClient();

  return useMutation<HarvestResponse, Error, CreateHarvest>({
    mutationFn: async (data: CreateHarvest) => {
      const response = await apiClient.post<HarvestResponse>(
        '/api/harvests',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HARVESTS_KEYS.all });
    },
  });
};

// Update a harvest
export const useUpdateHarvest = () => {
  const queryClient = useQueryClient();

  return useMutation<
    HarvestResponse,
    Error,
    { harvestId: string; data: UpdateHarvest }
  >({
    mutationFn: async ({ harvestId, data }) => {
      const response = await apiClient.put<HarvestResponse>(
        `/api/harvests/${harvestId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: HARVESTS_KEYS.detail(variables.harvestId),
      });
      queryClient.invalidateQueries({ queryKey: HARVESTS_KEYS.lists() });
    },
  });
};

// Set harvest weight
export const useSetHarvestWeight = () => {
  const queryClient = useQueryClient();

  return useMutation<
    HarvestResponse,
    Error,
    { harvestId: string; data: SetHarvestWeight }
  >({
    mutationFn: async ({ harvestId, data }) => {
      const response = await apiClient.put<HarvestResponse>(
        `/api/harvests/${harvestId}/weight`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: HARVESTS_KEYS.detail(variables.harvestId),
      });
      queryClient.invalidateQueries({ queryKey: HARVESTS_KEYS.lists() });
    },
  });
};

// Finalize a harvest
export const useFinalizeHarvest = () => {
  const queryClient = useQueryClient();

  return useMutation<HarvestResponse, Error, string>({
    mutationFn: async (harvestId: string) => {
      const response = await apiClient.post<HarvestResponse>(
        `/api/harvests/${harvestId}/finalize`,
      );
      return response.data;
    },
    onSuccess: (_, harvestId) => {
      queryClient.invalidateQueries({
        queryKey: HARVESTS_KEYS.detail(harvestId),
      });
      queryClient.invalidateQueries({ queryKey: HARVESTS_KEYS.lists() });
      // Also invalidate actions since new actions were created
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
};

// Reopen a harvest
export const useReopenHarvest = () => {
  const queryClient = useQueryClient();

  return useMutation<HarvestResponse, Error, string>({
    mutationFn: async (harvestId: string) => {
      const response = await apiClient.post<HarvestResponse>(
        `/api/harvests/${harvestId}/reopen`,
      );
      return response.data;
    },
    onSuccess: (_, harvestId) => {
      queryClient.invalidateQueries({
        queryKey: HARVESTS_KEYS.detail(harvestId),
      });
      queryClient.invalidateQueries({ queryKey: HARVESTS_KEYS.lists() });
      // Also invalidate actions since actions were deleted
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
};

// Delete a harvest
export const useDeleteHarvest = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (harvestId: string) => {
      await apiClient.delete(`/api/harvests/${harvestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HARVESTS_KEYS.all });
    },
  });
};
