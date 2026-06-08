import { useMutation } from '@tanstack/react-query';
import { authClient, useSession } from '@/lib/auth-client';
import { logApiError } from '../errorLogger';

export const useLogin = () =>
  useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await authClient.signIn.email(credentials);
      if (result.error) throw result.error;
      return result.data;
    },
    onError: error => {
      logApiError(error, '/api/auth/sign-in/email', 'POST');
    },
  });

export const useRegister = () =>
  useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name?: string;
      privacyPolicyConsent?: boolean;
      newsletterConsent?: boolean;
    }) => {
      const now = new Date();
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name ?? data.email,
        privacyPolicyConsent: data.privacyPolicyConsent ?? false,
        privacyConsentTimestamp: data.privacyPolicyConsent ? now : undefined,
        newsletterConsent: data.newsletterConsent ?? false,
        newsletterConsentTimestamp: data.newsletterConsent ? now : undefined,
      } as never);
      if (result.error) throw result.error;
      return result.data;
    },
    onError: error => {
      logApiError(error, '/api/auth/sign-up/email', 'POST');
    },
  });

export const useChangePassword = () =>
  useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (result.error) throw result.error;
      return result.data;
    },
    onError: error => {
      logApiError(error, '/api/auth/change-password', 'POST');
    },
  });

export const useUserProfile = () => {
  const { data, isPending, error } = useSession();
  return {
    data: data?.user ?? null,
    isLoading: isPending,
    error,
  };
};

export const useAuth = () => ({
  login: useLogin(),
  register: useRegister(),
  changePassword: useChangePassword(),
  profile: useUserProfile(),
});
