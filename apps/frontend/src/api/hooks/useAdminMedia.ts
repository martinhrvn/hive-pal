import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  AdminMediaListQuery,
  AdminMediaListResponse,
  AdminMediaStatsResponse,
  AdminMediaType,
} from 'shared-schemas';

const ADMIN_MEDIA_KEYS = {
  all: ['admin', 'media'] as const,
  list: (params: Partial<AdminMediaListQuery>) =>
    [...ADMIN_MEDIA_KEYS.all, 'list', params] as const,
  stats: () => [...ADMIN_MEDIA_KEYS.all, 'stats'] as const,
  downloadUrl: (type: AdminMediaType, id: string) =>
    [...ADMIN_MEDIA_KEYS.all, 'download-url', type, id] as const,
};

export const useAdminMediaList = (params: Partial<AdminMediaListQuery>) => {
  return useQuery<AdminMediaListResponse>({
    queryKey: ADMIN_MEDIA_KEYS.list(params),
    queryFn: async () => {
      const response = await apiClient.get<AdminMediaListResponse>(
        '/api/admin/media',
        { params },
      );
      return response.data;
    },
  });
};

export const useAdminMediaStats = () => {
  return useQuery<AdminMediaStatsResponse>({
    queryKey: ADMIN_MEDIA_KEYS.stats(),
    queryFn: async () => {
      const response = await apiClient.get<AdminMediaStatsResponse>(
        '/api/admin/media/stats',
      );
      return response.data;
    },
    staleTime: 60_000,
  });
};

export const useAdminMediaDownloadUrl = (
  type: AdminMediaType | undefined,
  id: string | undefined,
  options?: { enabled?: boolean },
) => {
  return useQuery<{ downloadUrl: string; expiresIn: number }>({
    queryKey: ADMIN_MEDIA_KEYS.downloadUrl(type!, id!),
    queryFn: async () => {
      const response = await apiClient.get<{
        downloadUrl: string;
        expiresIn: number;
      }>(`/api/admin/media/${type}/${id}/download-url`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!type && !!id,
    staleTime: 1000 * 60 * 50,
  });
};
