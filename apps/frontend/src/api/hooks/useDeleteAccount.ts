import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';

/**
 * Permanently deletes the authenticated user's account and all data they own.
 * Cache teardown / redirect is handled by the caller (via the logout sequence),
 * since the whole app state is torn down on success.
 */
export const useDeleteAccount = () =>
  useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.delete('/api/users/me');
    },
  });
