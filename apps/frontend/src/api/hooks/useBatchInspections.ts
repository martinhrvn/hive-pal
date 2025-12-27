import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  CreateBatchInspection,
  UpdateBatchInspection,
  ReorderBatchHives,
  BatchInspectionResponse,
  CurrentHiveToInspect,
  CreateInspection,
  InspectionResponse,
} from 'shared-schemas';

// Query keys
const BATCH_INSPECTIONS_KEYS = {
  all: ['batch-inspections'] as const,
  lists: () => [...BATCH_INSPECTIONS_KEYS.all, 'list'] as const,
  list: () => [...BATCH_INSPECTIONS_KEYS.lists()] as const,
  details: () => [...BATCH_INSPECTIONS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BATCH_INSPECTIONS_KEYS.details(), id] as const,
  current: (id: string) =>
    [...BATCH_INSPECTIONS_KEYS.detail(id), 'current'] as const,
};

// Get all batch inspections
export const useBatchInspections = () => {
  return useQuery<BatchInspectionResponse[]>({
    queryKey: BATCH_INSPECTIONS_KEYS.list(),
    queryFn: async () => {
      const response = await apiClient.get<BatchInspectionResponse[]>(
        '/api/batch-inspections',
      );
      return response.data;
    },
  });
};

// Get a single batch inspection by ID
export const useBatchInspection = (id: string, options = {}) => {
  return useQuery<BatchInspectionResponse>({
    queryKey: BATCH_INSPECTIONS_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<BatchInspectionResponse>(
        `/api/batch-inspections/${id}`,
      );
      return response.data;
    },
    ...options,
  });
};

// Get current hive to inspect
export const useCurrentHiveToInspect = (batchId: string, options = {}) => {
  return useQuery<CurrentHiveToInspect>({
    queryKey: BATCH_INSPECTIONS_KEYS.current(batchId),
    queryFn: async () => {
      const response = await apiClient.get<CurrentHiveToInspect>(
        `/api/batch-inspections/${batchId}/current`,
      );
      return response.data;
    },
    ...options,
  });
};

// Create a new batch inspection
export const useCreateBatchInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBatchInspection) => {
      const response = await apiClient.post<BatchInspectionResponse>(
        '/api/batch-inspections',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.lists(),
      });
    },
  });
};

// Update batch inspection
export const useUpdateBatchInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBatchInspection;
    }) => {
      const response = await apiClient.patch<BatchInspectionResponse>(
        `/api/batch-inspections/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.lists(),
      });
    },
  });
};

// Delete batch inspection
export const useDeleteBatchInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/batch-inspections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.lists(),
      });
    },
  });
};

// Reorder hives in batch
export const useReorderBatchHives = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ReorderBatchHives;
    }) => {
      const response = await apiClient.patch<BatchInspectionResponse>(
        `/api/batch-inspections/${id}/reorder`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.detail(variables.id),
      });
    },
  });
};

// Start batch inspection
export const useStartBatchInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<BatchInspectionResponse>(
        `/api/batch-inspections/${id}/start`,
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.lists(),
      });
    },
  });
};

// Skip current hive
export const useSkipHive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: string) => {
      const response = await apiClient.post<CurrentHiveToInspect>(
        `/api/batch-inspections/${batchId}/skip`,
      );
      return response.data;
    },
    onSuccess: (_, batchId) => {
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.detail(batchId),
      });
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.current(batchId),
      });
    },
  });
};

// Cancel a hive from batch
export const useCancelHiveFromBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId,
      hiveId,
    }: {
      batchId: string;
      hiveId: string;
    }) => {
      const response = await apiClient.delete<BatchInspectionResponse>(
        `/api/batch-inspections/${batchId}/hives/${hiveId}`,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.detail(variables.batchId),
      });
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.current(variables.batchId),
      });
    },
  });
};

// Create inspection and move to next hive
export const useCreateInspectionAndNext = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId,
      inspectionData,
    }: {
      batchId: string;
      inspectionData: CreateInspection;
    }) => {
      const response = await apiClient.post<{
        inspection: InspectionResponse;
        next: CurrentHiveToInspect | null;
      }>(`/api/batch-inspections/${batchId}/inspect`, inspectionData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate batch inspection queries
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.detail(variables.batchId),
      });
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.current(variables.batchId),
      });
      queryClient.invalidateQueries({
        queryKey: BATCH_INSPECTIONS_KEYS.lists(),
      });
      // Also invalidate inspections list
      queryClient.invalidateQueries({
        queryKey: ['inspections'],
      });
    },
  });
};
