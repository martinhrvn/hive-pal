import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  AccountTransferJob,
  CreateJobResponse,
} from 'shared-schemas';

export const ACCOUNT_TRANSFER_KEYS = {
  all: ['account-transfer'] as const,
  jobs: () => [...ACCOUNT_TRANSFER_KEYS.all, 'jobs'] as const,
};

const POLL_INTERVAL_MS = 3000;

export const useAccountTransferJobs = () => {
  return useQuery<AccountTransferJob[]>({
    queryKey: ACCOUNT_TRANSFER_KEYS.jobs(),
    queryFn: async () => {
      const res = await apiClient.get<AccountTransferJob[]>(
        '/api/account-transfer/jobs',
      );
      return res.data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasActive = data.some(
        (j) => j.status === 'PENDING' || j.status === 'RUNNING',
      );
      return hasActive ? POLL_INTERVAL_MS : false;
    },
  });
};

export const useStartExport = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateJobResponse, Error, void>({
    mutationFn: async () => {
      const res = await apiClient.post<CreateJobResponse>(
        '/api/account-transfer/export',
        {},
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_TRANSFER_KEYS.jobs() });
    },
  });
};

export const useStartImport = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateJobResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<CreateJobResponse>(
        '/api/account-transfer/import',
        formData,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_TRANSFER_KEYS.jobs() });
    },
  });
};

export const useDeleteAccountTransferJob = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/api/account-transfer/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_TRANSFER_KEYS.jobs() });
    },
  });
};
