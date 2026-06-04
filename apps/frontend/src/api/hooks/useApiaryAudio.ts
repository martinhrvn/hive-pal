import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  ApiaryAudioResponse,
  StartPendingAnalysisResponse,
} from 'shared-schemas';

export const APIARY_AUDIO_KEYS = {
  all: ['apiary-audio'] as const,
  list: (apiaryId: string | null | undefined) =>
    [...APIARY_AUDIO_KEYS.all, 'list', apiaryId ?? null] as const,
};

const isActiveStatus = (s: string | null | undefined) =>
  s === 'PENDING' || s === 'PROCESSING';

export const useApiaryAudio = (
  apiaryId: string | null | undefined,
  options?: { enabled?: boolean },
) => {
  return useQuery<ApiaryAudioResponse[]>({
    queryKey: APIARY_AUDIO_KEYS.list(apiaryId),
    queryFn: async () => {
      const response = await apiClient.get<ApiaryAudioResponse[]>(
        '/api/audio',
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!apiaryId,
    refetchInterval: query => {
      const data = query.state.data;
      if (!data) return false;
      const anyActive = data.some(
        a =>
          isActiveStatus(a.transcriptionStatus) ||
          isActiveStatus(a.analysisStatus),
      );
      return anyActive ? 3000 : false;
    },
  });
};

export const useDeleteApiaryAudio = (apiaryId: string | null | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { inspectionId: string; audioId: string }
  >({
    mutationFn: async ({ inspectionId, audioId }) => {
      await apiClient.delete(
        `/api/inspections/${inspectionId}/audio/${audioId}`,
      );
    },
    onSuccess: (_, { inspectionId }) => {
      void queryClient.invalidateQueries({
        queryKey: APIARY_AUDIO_KEYS.list(apiaryId),
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-audio', 'list', inspectionId],
      });
    },
  });
};

export const useStartPendingAnalysis = (apiaryId: string | null | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<StartPendingAnalysisResponse, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.post<StartPendingAnalysisResponse>(
        '/api/audio/analyze-pending',
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: APIARY_AUDIO_KEYS.list(apiaryId),
      });
    },
  });
};
