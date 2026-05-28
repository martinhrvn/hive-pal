import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export const useStartInspectionAudioAi = (
  inspectionId: string,
  audioId: string,
) => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/api/inspections/${inspectionId}/audio/${audioId}/ai/analyze`,
      );
      return response.data;
    },
  });
};

export const useInspectionAudioAiStatus = (
  inspectionId: string,
  audioId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ['inspection-audio-ai-status', inspectionId, audioId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/inspections/${inspectionId}/audio/${audioId}/ai/status`,
      );
      return response.data;
    },
    enabled,
    refetchInterval: query => {
      const data = query.state.data;
      const transcription = data?.transcriptionStatus;
      const analysis = data?.analysisStatus;
      const active = (s: string | undefined) =>
        s === 'PENDING' || s === 'PROCESSING';
      return active(transcription) || active(analysis) ? 3000 : false;
    },
  });
};

export const useUpdateInspectionAudioTranscription = (
  inspectionId: string,
  audioId: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transcription: string) => {
      const response = await apiClient.put(
        `/api/inspections/${inspectionId}/audio/${audioId}/transcription`,
        { transcription },
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['inspection-audio-ai-status', inspectionId, audioId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-audio-ai-result', inspectionId, audioId],
      });
    },
  });
};

export const useInspectionAudioAiResult = (
  inspectionId: string,
  audioId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ['inspection-audio-ai-result', inspectionId, audioId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/inspections/${inspectionId}/audio/${audioId}/ai/result`,
      );
      return response.data;
    },
    enabled,
  });
};