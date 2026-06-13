import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiClient } from '../client';
import { FrameAnalysisResponse } from 'shared-schemas';

export const FRAME_ANALYSIS_KEYS = {
  detail: (photoId: string) => ['frame-analysis', photoId] as const,
};

/** Fetch a previously stored frame analysis for a photo (404 -> null). */
export const useFrameAnalysis = (
  photoId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<FrameAnalysisResponse | null>({
    queryKey: FRAME_ANALYSIS_KEYS.detail(photoId),
    queryFn: async () => {
      try {
        const response = await apiClient.get<FrameAnalysisResponse>(
          `/api/photos/${photoId}/frame-analysis`,
        );
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: options?.enabled !== false && !!photoId,
  });
};

/** Trigger DeepBee analysis of a photo; caches the result on success. */
export const useAnalyzeFrame = () => {
  const queryClient = useQueryClient();

  return useMutation<FrameAnalysisResponse, Error, string>({
    mutationFn: async photoId => {
      const response = await apiClient.post<FrameAnalysisResponse>(
        `/api/photos/${photoId}/analyze-frame`,
      );
      return response.data;
    },
    onSuccess: data => {
      queryClient.setQueryData(FRAME_ANALYSIS_KEYS.detail(data.photoId), data);
    },
  });
};
