import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  CreateWorkerTokenDto,
  WorkerToken,
  WorkerTokenCreated,
  WorkerStatus,
} from 'shared-schemas';
import { AxiosError } from 'axios';

const WORKER_TOKENS_KEYS = {
  all: ['worker-tokens'] as const,
  list: () => [...WORKER_TOKENS_KEYS.all, 'list'] as const,
  status: () => ['worker-status'] as const,
};

export const useWorkerTokens = () => {
  return useQuery<WorkerToken[]>({
    queryKey: WORKER_TOKENS_KEYS.list(),
    queryFn: async () => {
      const response = await apiClient.get<WorkerToken[]>(
        '/api/admin/worker-tokens',
      );
      return response.data;
    },
    refetchInterval: 30_000,
  });
};

export const useCreateWorkerToken = () => {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  return useMutation<
    WorkerTokenCreated,
    AxiosError<{ message: string }>,
    CreateWorkerTokenDto
  >({
    mutationFn: async dto => {
      const response = await apiClient.post<WorkerTokenCreated>(
        '/api/admin/worker-tokens',
        dto,
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t('workerTokens.toasts.created'));
      await queryClient.invalidateQueries({
        queryKey: WORKER_TOKENS_KEYS.list(),
      });
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || t('workerTokens.toasts.createFailed'),
      );
    },
  });
};

export const useRevokeWorkerToken = () => {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/api/admin/worker-tokens/${id}`);
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t('workerTokens.toasts.revoked'));
      await queryClient.invalidateQueries({
        queryKey: WORKER_TOKENS_KEYS.list(),
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || t('workerTokens.toasts.revokeFailed'),
      );
    },
  });
};

export const useWorkerStatus = () => {
  return useQuery<WorkerStatus>({
    queryKey: WORKER_TOKENS_KEYS.status(),
    queryFn: async () => {
      const response = await apiClient.get<WorkerStatus>('/api/worker/status');
      return response.data;
    },
    refetchInterval: 30_000,
  });
};
