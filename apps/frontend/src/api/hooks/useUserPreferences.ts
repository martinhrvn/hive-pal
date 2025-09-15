import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { UserPreferences } from 'shared-schemas';
import { logApiError } from '../errorLogger';
import { TOKEN_KEY } from '@/context/auth-context/auth-provider';

// Query keys
const USER_PREFERENCES_KEYS = {
  all: ['userPreferences'] as const,
  preferences: () => [...USER_PREFERENCES_KEYS.all, 'preferences'] as const,
};

// Get user preferences query
export const useUserPreferences = () => {
  // Check if user is logged in by checking for token in localStorage
  // This avoids circular dependency with AuthContext
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY);
  
  return useQuery<UserPreferences | null>({
    queryKey: USER_PREFERENCES_KEYS.preferences(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<UserPreferences>(
          '/api/users/preferences',
        );
        return response.data;
      } catch (error) {
        // If preferences don't exist yet, return null instead of throwing
        if (error.response?.status === 404) {
          return null;
        }
        // If unauthorized (401), just return null - user is not logged in
        if (error.response?.status === 401) {
          return null;
        }
        // Log other errors
        logApiError(error, '/api/users/preferences', 'GET');
        throw error;
      }
    },
    // Only fetch preferences if user has a token
    enabled: hasToken,
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on 401 errors
  });
};

// Update user preferences mutation
export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      const response = await apiClient.put<UserPreferences>(
        '/api/users/preferences',
        preferences,
      );
      return response.data;
    },
    onSuccess: data => {
      // Update preferences in cache
      queryClient.setQueryData(USER_PREFERENCES_KEYS.preferences(), data);
    },
    onError: error => {
      logApiError(error, '/api/users/preferences', 'PUT');
    },
  });
};

// Combined hook for convenience
export const usePreferences = () => {
  return {
    preferences: useUserPreferences(),
    updatePreferences: useUpdateUserPreferences(),
  };
};
