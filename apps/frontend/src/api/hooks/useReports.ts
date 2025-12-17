import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { ApiaryStatistics, TrendData, ReportPeriod } from 'shared-schemas';

export const useApiaryStatistics = (apiaryId: string | undefined, period: ReportPeriod = 'ytd') => {
  return useQuery({
    queryKey: ['reports', 'statistics', apiaryId, period],
    queryFn: async () => {
      const response = await apiClient.get<ApiaryStatistics>(
        `/api/reports/apiary/${apiaryId}/statistics`,
        { params: { period } }
      );
      return response.data;
    },
    enabled: !!apiaryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useApiaryTrends = (apiaryId: string | undefined, period: ReportPeriod = 'ytd') => {
  return useQuery({
    queryKey: ['reports', 'trends', apiaryId, period],
    queryFn: async () => {
      const response = await apiClient.get<TrendData>(
        `/api/reports/apiary/${apiaryId}/trends`,
        { params: { period } }
      );
      return response.data;
    },
    enabled: !!apiaryId,
    staleTime: 5 * 60 * 1000,
  });
};
