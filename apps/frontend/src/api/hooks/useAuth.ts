import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { AuthResponse, Login, Register, User } from 'shared-schemas';
import { logApiError } from '../errorLogger';

// Query keys
const AUTH_KEYS = {
  all: ['auth'] as const,
  user: () => [...AUTH_KEYS.all, 'user'] as const,
  profile: () => [...AUTH_KEYS.all, 'profile'] as const,
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: Login) => {
      const response = await apiClient.post<AuthResponse>(
        '/api/auth/login',
        credentials,
      );
      return response.data;
    },
    onSuccess: data => {
      // Update user data in cache
      queryClient.setQueryData(AUTH_KEYS.user(), data.user);
    },
    onError: error => {
      logApiError(error, '/api/auth/login', 'POST');
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: Register) => {
      const response = await apiClient.post<AuthResponse>(
        '/api/auth/register',
        userData,
      );
      return response.data;
    },
    onSuccess: data => {
      // Update user data in cache
      queryClient.setQueryData(AUTH_KEYS.user(), data.user);
    },
    onError: error => {
      logApiError(error, '/api/auth/register', 'POST');
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await apiClient.post<{ success: boolean }>(
        '/api/auth/change-password',
        data,
      );
      return response.data;
    },
    onError: error => {
      logApiError(error, '/api/auth/change-password', 'POST');
    },
  });
};

// Reset password mutation (for admin or forgot password flow)
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: { userId: string; newPassword: string }) => {
      const response = await apiClient.post<{ success: boolean }>(
        '/api/auth/reset-password',
        data,
      );
      return response.data;
    },
    onError: error => {
      logApiError(error, '/api/auth/reset-password', 'POST');
    },
  });
};

// User profile query - fetches the current user's profile
export const useUserProfile = (options = {}) => {
  return useQuery<User>({
    queryKey: AUTH_KEYS.profile(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<User>('/api/auth/me');
        return response.data;
      } catch (error) {
        logApiError(error, '/api/auth/me', 'GET');
        throw error;
      }
    },

    // Don't refetch on window focus by default
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Combined hook for convenience
export const useAuth = () => {
  return {
    login: useLogin(),
    register: useRegister(),
    changePassword: useChangePassword(),
    resetPassword: useResetPassword(),
    profile: useUserProfile(),
  };
};
