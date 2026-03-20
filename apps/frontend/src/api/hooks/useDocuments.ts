import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  DocumentResponse,
  DocumentFilter,
} from 'shared-schemas';

export const DOCUMENT_KEYS = {
  all: ['documents'] as const,
  list: (filters?: DocumentFilter) =>
    [...DOCUMENT_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...DOCUMENT_KEYS.all, 'detail', id] as const,
  downloadUrl: (id: string) =>
    [...DOCUMENT_KEYS.all, 'download-url', id] as const,
};

export const useDocuments = (
  filters?: DocumentFilter,
  options?: { enabled?: boolean },
) => {
  return useQuery<DocumentResponse[]>({
    queryKey: DOCUMENT_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hiveId) params.set('hiveId', filters.hiveId);
      if (filters?.apiaryId) params.set('apiaryId', filters.apiaryId);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      const query = params.toString();
      const response = await apiClient.get<DocumentResponse[]>(
        `/api/documents${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<DocumentResponse, Error, FormData>({
    mutationFn: async formData => {
      const response = await apiClient.post<DocumentResponse>(
        '/api/documents',
        formData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENT_KEYS.all,
      });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async id => {
      await apiClient.delete(`/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENT_KEYS.all,
      });
    },
  });
};

export const useDocumentDownloadUrl = (
  id: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<{ downloadUrl: string; expiresIn: number }>({
    queryKey: DOCUMENT_KEYS.downloadUrl(id),
    queryFn: async () => {
      const response = await apiClient.get<{ downloadUrl: string; expiresIn: number }>(
        `/api/documents/${id}/download-url`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 1000 * 60 * 50,
  });
};
