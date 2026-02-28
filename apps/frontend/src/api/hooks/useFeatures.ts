import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { FeaturesResponse } from 'shared-schemas';

export const FEATURES_KEYS = {
  all: ['features'] as const,
};

export const useFeatures = () => {
  return useQuery<FeaturesResponse>({
    queryKey: FEATURES_KEYS.all,
    queryFn: async () => {
      const response = await apiClient.get<FeaturesResponse>('/api/features');
      return response.data;
    },
    staleTime: Infinity,
  });
};
