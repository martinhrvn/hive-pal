import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useApiaryScope } from '@/hooks/use-apiary-scope';
import { PhotoResponse, PhotoFilter } from 'shared-schemas';

export const PHOTO_KEYS = {
  all: ['photos'] as const,
  // The apiary scope ('all' or a concrete id) is part of the key: see useApiaryScope.
  list: (scope: string | null, filters?: PhotoFilter) =>
    [...PHOTO_KEYS.all, 'list', scope, filters] as const,
  detail: (id: string) => [...PHOTO_KEYS.all, 'detail', id] as const,
  downloadUrl: (id: string) => [...PHOTO_KEYS.all, 'download-url', id] as const,
};

export const usePhotos = (
  filters?: PhotoFilter,
  options?: { enabled?: boolean },
) => {
  const scope = useApiaryScope();
  return useQuery<PhotoResponse[]>({
    queryKey: PHOTO_KEYS.list(scope, filters),
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

// --- Inspection Photo Hooks ---

export const INSPECTION_PHOTO_KEYS = {
  all: (inspectionId: string) => ['inspection-photos', inspectionId] as const,
  downloadUrl: (inspectionId: string, photoId: string) =>
    ['inspection-photos', inspectionId, 'download-url', photoId] as const,
};

export const useInspectionPhotos = (
  inspectionId?: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<PhotoResponse[]>({
    queryKey: INSPECTION_PHOTO_KEYS.all(inspectionId!),
    queryFn: async () => {
      const response = await apiClient.get<PhotoResponse[]>(
        `/api/inspections/${inspectionId}/photos`,
      );
      return response.data;
    },
    enabled: !!inspectionId && options?.enabled !== false,
  });
};

export const useUploadInspectionPhoto = (inspectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<PhotoResponse, Error, FormData>({
    mutationFn: async formData => {
      const response = await apiClient.post<PhotoResponse>(
        `/api/inspections/${inspectionId}/photos`,
        formData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INSPECTION_PHOTO_KEYS.all(inspectionId),
      });
    },
  });
};

export const useDeleteInspectionPhoto = (inspectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async photoId => {
      await apiClient.delete(
        `/api/inspections/${inspectionId}/photos/${photoId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INSPECTION_PHOTO_KEYS.all(inspectionId),
      });
    },
  });
};

export const useInspectionPhotoDownloadUrl = (
  inspectionId: string,
  photoId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<{ downloadUrl: string; expiresIn: number }>({
    queryKey: INSPECTION_PHOTO_KEYS.downloadUrl(inspectionId, photoId),
    queryFn: async () => {
      const response = await apiClient.get<{
        downloadUrl: string;
        expiresIn: number;
      }>(`/api/inspections/${inspectionId}/photos/${photoId}/download-url`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!inspectionId && !!photoId,
    staleTime: 1000 * 60 * 50,
  });
};

export const getInspectionPhotoDownloadUrl = async (
  inspectionId: string,
  photoId: string,
): Promise<string> => {
  const response = await apiClient.get<{
    downloadUrl: string;
    expiresIn: number;
  }>(`/api/inspections/${inspectionId}/photos/${photoId}/download-url`);
  return response.data.downloadUrl;
};

export const useStandalonePhotoDownloadUrl = (
  id: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<{ downloadUrl: string; expiresIn: number }>({
    queryKey: PHOTO_KEYS.downloadUrl(id),
    queryFn: async () => {
      const response = await apiClient.get<{
        downloadUrl: string;
        expiresIn: number;
      }>(`/api/photos/${id}/download-url`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 1000 * 60 * 50,
  });
};
