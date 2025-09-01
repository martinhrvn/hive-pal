import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';
import { CreateFeedbackDto, Feedback } from 'shared-schemas';

// Submit new feedback
export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: async (data: CreateFeedbackDto) => {
      const response = await apiClient.post('/api/feedback', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    },
  });
};

// Get my feedback submissions
export const useMyFeedback = () => {
  return useQuery({
    queryKey: ['feedback', 'my'],
    queryFn: async () => {
      const response = await apiClient.get<Feedback[]>('/api/feedback/my');
      return response.data;
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
      
      const response = await apiClient.get(`/api/feedback?${params.toString()}`);
      return response.data;
    },
    enabled: !!filters, // Only fetch when filters are provided
  });
};

// Admin: Update feedback status
export const useUpdateFeedbackStatus = () => {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.patch(`/api/feedback/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Feedback status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update feedback status');
    },
  });
};