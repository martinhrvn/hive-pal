import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { CreateFeedbackDto } from 'shared-schemas';
import { AxiosError } from 'axios';

// Submit new feedback
export const useSubmitFeedback = () => {
  const { t } = useTranslation('common');
  return useMutation({
    mutationFn: async (data: CreateFeedbackDto) => {
      const response = await apiClient.post('/api/feedback', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('feedback.toasts.submitted'));
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message || t('feedback.toasts.submitFailed'),
      );
    },
  });
};

// Admin: Get all feedback
export const useAllFeedback = (filters?: {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['feedback', 'all', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await apiClient.get(
        `/api/feedback?${params.toString()}`,
      );
      return response.data;
    },
    enabled: !!filters, // Only fetch when filters are provided
  });
};

// Admin: Update feedback status
export const useUpdateFeedbackStatus = () => {
  const { t } = useTranslation('admin');
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.patch(`/api/feedback/${id}/status`, {
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('feedback.toasts.statusUpdated'));
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        error.response?.data?.message ||
          t('feedback.toasts.statusUpdateFailed'),
      );
    },
  });
};
