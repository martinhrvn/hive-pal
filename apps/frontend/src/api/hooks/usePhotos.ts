import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  PhotoResponse,
  PhotoFilter,
} from 'shared-schemas';

export const PHOTO_KEYS = {
  all: ['photos'] as const,
  list: (filters?: PhotoFilter) =>
    [...PHOTO_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...PHOTO_KEYS.all, 'detail', id] as const,
  downloadUrl: (id: string) =>
    [...PHOTO_KEYS.all, 'download-url', id] as const,
};

export const usePhotos = (
  filters?: PhotoFilter,
  options?: { enabled?: boolean },
) => {
  return useQuery<PhotoResponse[]>({
    queryKey: PHOTO_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hiveId) params.set('hiveId', filters.hiveId);
      if (filters?.apiaryId) params.set('apiaryId', filters.apiaryId);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      const query = params.toString();
      const response = await apiClient.get<PhotoResponse[]>(
        `/api/photos${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
};

export const useCreatePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation<PhotoResponse, Error, FormData>({
    mutationFn: async formData => {
      const response = await apiClient.post<PhotoResponse>(
        '/api/photos',
        formData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PHOTO_KEYS.all,
      });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async id => {
      await apiClient.delete(`/api/photos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PHOTO_KEYS.all,
      });
    },
  });
};

export const useStandalonePhotoDownloadUrl = (
  id: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<{ downloadUrl: string; expiresIn: number }>({
    queryKey: PHOTO_KEYS.downloadUrl(id),
    queryFn: async () => {
      const response = await apiClient.get<{ downloadUrl: string; expiresIn: number }>(
        `/api/photos/${id}/download-url`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 1000 * 60 * 50,
  });
};
