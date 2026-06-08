import React, { useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '@/context/auth-context/auth-context.ts';
import { authClient, useSession } from '@/lib/auth-client';

export const APIARY_SELECTION = 'hive_pal_apiary_selection';
const LEGACY_TOKEN_KEY = 'hive_pal_auth_token';

interface AuthProviderProps {
  children: React.ReactNode;
}

const sanitizeRedirect = (url: string, fallback = '/'): string => {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return fallback;
  return url;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;
  const isLoggedIn = !!user;

  // One-time cleanup of the legacy JWT token left over by the pre-Better-Auth client
  useEffect(() => {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }, []);

  // Force password-change page if the flag is set
  useEffect(() => {
    if (
      user?.passwordChangeRequired &&
      window.location.pathname !== '/account/change-password'
    ) {
      window.location.href = '/account/change-password';
    }
  }, [user?.passwordChangeRequired]);

  const login = useCallback(
    async (username: string, password: string, from = '/') => {
      const result = await authClient.signIn.email({
        email: username,
        password,
      });
      if (result.error) {
        console.error('Login error:', result.error);
        return false;
      }
      const target = result.data?.user?.passwordChangeRequired
        ? '/account/change-password'
        : sanitizeRedirect(from);
      window.location.href = target;
      return true;
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      name?: string,
      privacyPolicyConsent?: boolean,
      newsletterConsent?: boolean,
      redirectTo?: string,
    ) => {
      const now = new Date();
      const result = await authClient.signUp.email({
        email,
        password,
        name: name ?? email,
        privacyPolicyConsent: privacyPolicyConsent ?? false,
        privacyConsentTimestamp: privacyPolicyConsent ? now : undefined,
        newsletterConsent: newsletterConsent ?? false,
        newsletterConsentTimestamp: newsletterConsent ? now : undefined,
      } as never);
      if (result.error) {
        console.error('Registration error:', result.error);
        return false;
      }
      window.location.href = sanitizeRedirect(
        redirectTo ?? '/onboarding',
        '/onboarding',
      );
      return true;
    },
    [],
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    queryClient.clear();
    localStorage.removeItem(APIARY_SELECTION);
    localStorage.removeItem('hive-pal-query-cache');
    window.location.href = '/login';
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn,
      isLoading: isPending,
      login,
      register,
      logout,
    }),
    [user, isLoggedIn, isPending, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
