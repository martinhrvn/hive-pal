import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  CreateFrameSizeDto,
  FrameSize,
  UpdateFrameSizeDto,
} from 'shared-schemas';
import { AxiosError } from 'axios';

const FRAME_SIZES_KEYS = {
  all: ['frame-sizes'] as const,
  lists: () => [...FRAME_SIZES_KEYS.all, 'list'] as const,
  admin: () => [...FRAME_SIZES_KEYS.all, 'admin'] as const,
  pending: () => [...FRAME_SIZES_KEYS.all, 'pending'] as const,
};

// Get all available frame sizes (approved + own pending)
export const useFrameSizes = () => {
  return useQuery<FrameSize[]>({
    queryKey: FRAME_SIZES_KEYS.lists(),
    queryFn: async () => {
      const response = await apiClient.get<FrameSize[]>('/api/frame-sizes');
      return response.data;
    },
  });
};

// Submit a new frame size for review
export const useSubmitFrameSize = () => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFrameSizeDto): Promise<FrameSize> => {
      const response = await apiClient.post<FrameSize>(
        '/api/frame-sizes',
        data,
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t('frameSizeToasts.submitted'));
      await queryClient.invalidateQueries({
        queryKey: FRAME_SIZES_KEYS.lists(),
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || t('frameSizeToasts.submitFailed'),
      );
    },
  });
};

// Edit a custom frame size (its creator, or an admin for any non-built-in one)
export const useUpdateFrameSize = () => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFrameSizeDto;
    }): Promise<FrameSize> => {
      const response = await apiClient.put<FrameSize>(
        `/api/frame-sizes/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t('frameSizeToasts.updated'));
      // Invalidating the shared prefix refreshes the settings list, the admin
      // list and the pending queue in one go.
      await queryClient.invalidateQueries({
        queryKey: FRAME_SIZES_KEYS.all,
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || t('frameSizeToasts.updateFailed'),
      );
    },
  });
};

// Admin: Get all frame sizes
export const useAdminFrameSizes = () => {
  return useQuery<FrameSize[]>({
    queryKey: FRAME_SIZES_KEYS.admin(),
    queryFn: async () => {
      const response = await apiClient.get<FrameSize[]>(
        '/api/admin/frame-sizes',
      );
      return response.data;
    },
  });
};

// Admin: Get pending frame sizes
export const usePendingFrameSizes = () => {
  return useQuery<FrameSize[]>({
    queryKey: FRAME_SIZES_KEYS.pending(),
    queryFn: async () => {
      const response = await apiClient.get<FrameSize[]>(
        '/api/admin/frame-sizes/pending',
      );
      return response.data;
    },
  });
};

// Admin: Approve a frame size
export const useApproveFrameSize = () => {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(
        `/api/admin/frame-sizes/${id}/approve`,
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t('frameSizes.toasts.approved'));
      await queryClient.invalidateQueries({
        queryKey: FRAME_SIZES_KEYS.all,
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || t('frameSizes.toasts.approveFailed'),
      );
    },
  });
};

// Admin: Reject a frame size
export const useRejectFrameSize = () => {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(
        `/api/admin/frame-sizes/${id}/reject`,
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t('frameSizes.toasts.rejected'));
      await queryClient.invalidateQueries({
        queryKey: FRAME_SIZES_KEYS.all,
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || t('frameSizes.toasts.rejectFailed'),
      );
    },
  });
};

// Admin: Delete a frame size
export const useDeleteFrameSize = () => {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/api/admin/frame-sizes/${id}`);
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t('frameSizes.toasts.deleted'));
      await queryClient.invalidateQueries({
        queryKey: FRAME_SIZES_KEYS.all,
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || t('frameSizes.toasts.deleteFailed'),
      );
    },
  });
};
