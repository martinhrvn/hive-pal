import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useApiaryStore } from '@/hooks/use-apiary';
import {
  CreateQueen,
  UpdateQueen,
  QueenResponse,
  QueenDetail,
  RecordQueenTransfer,
} from 'shared-schemas';
import type { UseQueryOptions } from '@tanstack/react-query';

const QUEENS_KEYS = {
  all: ['queens'] as const,
  lists: () => [...QUEENS_KEYS.all, 'list'] as const,
  // Scope ('all' or the selected apiary id) keeps single- and cross-apiary
  // results in separate cache entries.
  list: (scope: string | null, params?: { hiveId?: string; status?: string }) =>
    [...QUEENS_KEYS.lists(), scope, params] as const,
  details: () => [...QUEENS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUEENS_KEYS.details(), id] as const,
  history: (id: string) => [...QUEENS_KEYS.all, 'history', id] as const,
  hiveHistory: (hiveId: string) =>
    [...QUEENS_KEYS.all, 'hiveHistory', hiveId] as const,
};

export const useQueens = (
  params?: { hiveId?: string; status?: string },
  queryOptions?: UseQueryOptions<QueenResponse[]>,
) => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  const viewAllApiaries = useApiaryStore(state => state.viewAllApiaries);
  const scope = viewAllApiaries ? 'all' : activeApiaryId;
  return useQuery<QueenResponse[]>({
    queryKey: QUEENS_KEYS.list(scope, params),
    queryFn: async () => {
      const urlParams = new URLSearchParams();
      if (params?.hiveId) urlParams.append('hiveId', params.hiveId);
      if (params?.status) urlParams.append('status', params.status);
      const query = urlParams.toString();
      const url = query ? `/api/queens?${query}` : '/api/queens';
      const response = await apiClient.get<QueenResponse[]>(url);
      return response.data;
    },
    ...queryOptions,
  });
};

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

export const useQueenHistory = (queenId: string) => {
  return useQuery<QueenDetail>({
    queryKey: QUEENS_KEYS.history(queenId),
    queryFn: async () => {
      const response = await apiClient.get<QueenDetail>(
        `/api/queens/${queenId}/history`,
      );
      return response.data;
    },
    enabled: !!queenId,
  });
};

export const useHiveQueenHistory = (hiveId: string) => {
  return useQuery<QueenResponse[]>({
    queryKey: QUEENS_KEYS.hiveHistory(hiveId),
    queryFn: async () => {
      const response = await apiClient.get<QueenResponse[]>(
        `/api/queens/hive/${hiveId}/history`,
      );
      return response.data;
    },
    enabled: !!hiveId,
  });
};

export const useCreateQueen = (callbacks?: { onSuccess: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateQueen) => {
      const response = await apiClient.post<QueenResponse>('/api/queens', data);
      return response.data;
    },
    onSuccess: async data => {
      callbacks?.onSuccess?.();
      await queryClient.invalidateQueries({ queryKey: QUEENS_KEYS.lists() });
      if (data.hiveId) {
        await queryClient.invalidateQueries({
          queryKey: ['hives', 'detail', data.hiveId],
        });
        await queryClient.invalidateQueries({
          queryKey: QUEENS_KEYS.hiveHistory(data.hiveId),
        });
      }
    },
  });
};

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
      await queryClient.invalidateQueries({
        queryKey: QUEENS_KEYS.detail(variables.id),
      });
      await queryClient.invalidateQueries({ queryKey: QUEENS_KEYS.lists() });
      if (data.hiveId) {
        await queryClient.invalidateQueries({
          queryKey: ['hives', 'detail', data.hiveId],
        });
      }
    },
  });
};

export const useRecordQueenTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      queenId,
      data,
    }: {
      queenId: string;
      data: RecordQueenTransfer;
      fromHiveId?: string | null;
    }) => {
      const response = await apiClient.post<QueenDetail>(
        `/api/queens/${queenId}/transfer`,
        data,
      );
      return response.data;
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUEENS_KEYS.history(variables.queenId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUEENS_KEYS.detail(variables.queenId),
      });
      await queryClient.invalidateQueries({ queryKey: QUEENS_KEYS.lists() });
      if (data.hiveId) {
        await queryClient.invalidateQueries({
          queryKey: ['hives', 'detail', data.hiveId],
        });
        await queryClient.invalidateQueries({
          queryKey: QUEENS_KEYS.hiveHistory(data.hiveId),
        });
      }
      if (variables.fromHiveId) {
        await queryClient.invalidateQueries({
          queryKey: ['hives', 'detail', variables.fromHiveId],
        });
        await queryClient.invalidateQueries({
          queryKey: QUEENS_KEYS.hiveHistory(variables.fromHiveId),
        });
      }
    },
  });
};

export const useDeleteQueen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/queens/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to delete queen with id ${id}`);
      return id;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: QUEENS_KEYS.lists() });
    },
  });
};
