import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  QuickCheckResponse,
  QuickCheckPhotoResponse,
  CreateQuickCheck,
  QuickCheckFilter,
  PhotoDownloadUrlResponse,
} from 'shared-schemas';

export const QUICK_CHECK_KEYS = {
  all: ['quick-checks'] as const,
  list: (filters?: QuickCheckFilter) =>
    [...QUICK_CHECK_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...QUICK_CHECK_KEYS.all, 'detail', id] as const,
  photoDownloadUrl: (quickCheckId: string, photoId: string) =>
    [...QUICK_CHECK_KEYS.all, 'photo-download', quickCheckId, photoId] as const,
};

export const useQuickChecks = (
  filters?: QuickCheckFilter,
  options?: { enabled?: boolean },
) => {
  return useQuery<QuickCheckResponse[]>({
    queryKey: QUICK_CHECK_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hiveId) params.set('hiveId', filters.hiveId);
      if (filters?.apiaryId) params.set('apiaryId', filters.apiaryId);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      const query = params.toString();
      const response = await apiClient.get<QuickCheckResponse[]>(
        `/api/quick-checks${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
};

export const useQuickCheck = (id: string, options?: { enabled?: boolean }) => {
  return useQuery<QuickCheckResponse>({
    queryKey: QUICK_CHECK_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<QuickCheckResponse>(
        `/api/quick-checks/${id}`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
};

export const useCreateQuickCheck = () => {
  const queryClient = useQueryClient();

  return useMutation<QuickCheckResponse, Error, CreateQuickCheck>({
    mutationFn: async dto => {
      const response = await apiClient.post<QuickCheckResponse>(
        '/api/quick-checks',
        dto,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUICK_CHECK_KEYS.all,
      });
    },
  });
};

export const useDeleteQuickCheck = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async id => {
      await apiClient.delete(`/api/quick-checks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUICK_CHECK_KEYS.all,
      });
    },
  });
};

export const useUploadQuickCheckPhoto = (quickCheckId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<QuickCheckPhotoResponse, Error, File>({
    mutationFn: async file => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<QuickCheckPhotoResponse>(
        `/api/quick-checks/${quickCheckId}/photos`,
        formData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUICK_CHECK_KEYS.all,
      });
    },
  });

  return {
    upload: (file: File) => mutation.mutateAsync(file),
    isUploading: mutation.isPending,
    error: mutation.error,
  };
};

export const useDeleteQuickCheckPhoto = (quickCheckId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async photoId => {
      await apiClient.delete(
        `/api/quick-checks/${quickCheckId}/photos/${photoId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUICK_CHECK_KEYS.all,
      });
    },
  });
};

export const usePhotoDownloadUrl = (
  quickCheckId: string,
  photoId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<PhotoDownloadUrlResponse>({
    queryKey: QUICK_CHECK_KEYS.photoDownloadUrl(quickCheckId, photoId),
    queryFn: async () => {
      const response = await apiClient.get<PhotoDownloadUrlResponse>(
        `/api/quick-checks/${quickCheckId}/photos/${photoId}/download-url`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!quickCheckId && !!photoId,
    staleTime: 1000 * 60 * 50, // 50 minutes (URL expires in 1 hour)
  });
};
