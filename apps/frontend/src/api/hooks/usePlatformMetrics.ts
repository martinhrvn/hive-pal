import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { PlatformMetricsSnapshot } from 'shared-schemas';

// Query keys
const PLATFORM_METRICS_KEYS = {
  all: ['admin', 'platform-metrics'] as const,
  list: (params?: { startDate?: string; endDate?: string }) =>
    [...PLATFORM_METRICS_KEYS.all, 'list', params] as const,
  latest: () => [...PLATFORM_METRICS_KEYS.all, 'latest'] as const,
};

// Get platform metrics snapshots
export const usePlatformMetrics = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery<PlatformMetricsSnapshot[]>({
    queryKey: PLATFORM_METRICS_KEYS.list(params),
    queryFn: async () => {
      const response = await apiClient.get<PlatformMetricsSnapshot[]>(
        '/api/admin/platform-metrics',
        { params },
      );
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
};

// Get latest snapshot
export const useLatestPlatformMetrics = () => {
  return useQuery<PlatformMetricsSnapshot | null>({
    queryKey: PLATFORM_METRICS_KEYS.latest(),
    queryFn: async () => {
      const response = await apiClient.get<PlatformMetricsSnapshot | null>(
        '/api/admin/platform-metrics/latest',
      );
      return response.data;
    },
    staleTime: 60000,
  });
};
