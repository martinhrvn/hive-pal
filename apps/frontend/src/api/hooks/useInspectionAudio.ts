import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { AudioResponse, DownloadUrlResponse } from 'shared-schemas';

// Query keys
export const INSPECTION_AUDIO_KEYS = {
  all: ['inspection-audio'] as const,
  list: (inspectionId: string) =>
    [...INSPECTION_AUDIO_KEYS.all, 'list', inspectionId] as const,
  downloadUrl: (inspectionId: string, audioId: string) =>
    [...INSPECTION_AUDIO_KEYS.all, 'download', inspectionId, audioId] as const,
};

/**
 * Get all audio recordings for an inspection
 */
export const useInspectionAudio = (
  inspectionId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery<AudioResponse[]>({
    queryKey: INSPECTION_AUDIO_KEYS.list(inspectionId),
    queryFn: async () => {
      const response = await apiClient.get<AudioResponse[]>(
        `/api/inspections/${inspectionId}/audio`
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!inspectionId,
  });
};

/**
 * Delete an audio recording
 */
export const useDeleteInspectionAudio = (inspectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (audioId) => {
      await apiClient.delete(`/api/inspections/${inspectionId}/audio/${audioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INSPECTION_AUDIO_KEYS.list(inspectionId),
      });
    },
  });
};

/**
 * Get a download URL for an audio recording
 */
export const useAudioDownloadUrl = (
  inspectionId: string,
  audioId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery<DownloadUrlResponse>({
    queryKey: INSPECTION_AUDIO_KEYS.downloadUrl(inspectionId, audioId),
    queryFn: async () => {
      const response = await apiClient.get<DownloadUrlResponse>(
        `/api/inspections/${inspectionId}/audio/${audioId}/download-url`
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!inspectionId && !!audioId,
    staleTime: 1000 * 60 * 50, // 50 minutes (URL expires in 1 hour)
  });
};

/**
 * Get download URL as a function (for on-demand fetching)
 */
export const getAudioDownloadUrl = async (
  inspectionId: string,
  audioId: string
): Promise<string> => {
  const response = await apiClient.get<DownloadUrlResponse>(
    `/api/inspections/${inspectionId}/audio/${audioId}/download-url`
  );
  return response.data.downloadUrl;
};

/**
 * Upload audio recording to the backend
 */
export const useUploadInspectionAudio = (inspectionId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    AudioResponse,
    Error,
    { blob: Blob; fileName: string; duration: number }
  >({
    mutationFn: async ({ blob, fileName, duration }) => {
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('fileName', fileName);
      formData.append('duration', duration.toString());

      const response = await apiClient.post<AudioResponse>(
        `/api/inspections/${inspectionId}/audio`,
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INSPECTION_AUDIO_KEYS.list(inspectionId),
      });
    },
  });

  return {
    upload: (blob: Blob, fileName: string, duration: number) =>
      mutation.mutateAsync({ blob, fileName, duration }),
    isUploading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
