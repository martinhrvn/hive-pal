import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';
import { CreateFrameSizeDto, FrameSize } from 'shared-schemas';
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
      toast.success('Frame size submitted for review');
      await queryClient.invalidateQueries({
        queryKey: FRAME_SIZES_KEYS.lists(),
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || 'Failed to submit frame size',
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(
        `/api/admin/frame-sizes/${id}/approve`,
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Frame size approved');
      await queryClient.invalidateQueries({
        queryKey: FRAME_SIZES_KEYS.all,
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || 'Failed to approve frame size',
      );
    },
  });
};

// Admin: Reject a frame size
export const useRejectFrameSize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(
        `/api/admin/frame-sizes/${id}/reject`,
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Frame size rejected');
      await queryClient.invalidateQueries({
        queryKey: FRAME_SIZES_KEYS.all,
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || 'Failed to reject frame size',
      );
    },
  });
};

// Admin: Delete a frame size
export const useDeleteFrameSize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(
        `/api/admin/frame-sizes/${id}`,
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Frame size deleted');
      await queryClient.invalidateQueries({
        queryKey: FRAME_SIZES_KEYS.all,
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || 'Failed to delete frame size',
      );
    },
  });
};
