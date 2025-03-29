import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { AuthResponse, Login, Register, User } from 'shared-schemas';

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
  });
};

// User profile query - fetches the current user's profile
export const useUserProfile = (options = {}) => {
  return useQuery<User>({
    queryKey: AUTH_KEYS.profile(),
    queryFn: async () => {
      const response = await apiClient.get<User>('/api/auth/me');
      return response.data;
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
