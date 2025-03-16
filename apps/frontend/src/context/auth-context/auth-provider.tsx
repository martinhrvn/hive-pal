import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl } from '@/api/client.ts';
import { decodeJwt, isTokenExpired } from '@/utils/jwt-utils';
import { AuthContext } from '@/context/auth-context/auth-context.ts';
import { AXIOS_INSTANCE, useAuthControllerRegister } from 'api-client';

const TOKEN_KEY = 'hive_pal_auth_token';
export const APIARY_SELECTION = 'hive_pal_apiary_selection';

interface AuthProviderProps {
  children: React.ReactNode;
}

AXIOS_INSTANCE.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  const apiaryId = localStorage.getItem(APIARY_SELECTION);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (apiaryId) {
      config.headers['x-apiary-id'] = apiaryId;
    }
  }
  config.baseURL = getApiUrl('');
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Unauthorized, clear token and redirect to login
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage
    const storedToken = localStorage.getItem(TOKEN_KEY);

    // Check if token is valid and not expired
    if (storedToken && !isTokenExpired(storedToken)) {
      return storedToken;
    }

    // Clear invalid token
    localStorage.removeItem(TOKEN_KEY);
    return null;
  });

  const isLoggedIn = !!token && !isTokenExpired(token);
  // Set up axios interceptors for authentication and handling 401 errors
  // Update user data when token changes
  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      // Store token in localStorage
      localStorage.setItem(TOKEN_KEY, token);

      // Extract user data from token
      const decodedToken = decodeJwt(token);

      if (decodedToken) {
        if (
          decodedToken.passwordChangeRequired &&
          window.location.pathname !== '/account/change-password'
        ) {
          window.location.href = '/account/change-password';
        }
      }
    } else {
      // Clean up when token is removed or invalid
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = useCallback(
    async (username: string, password: string, from: string = '/') => {
      try {
        const response = await axios.post(getApiUrl('/api/auth/login'), {
          email: username,
          password,
        });

        if (response.data && response.data.access_token) {
          setToken(response.data.access_token);

          // Redirect to password change page if password change is required
          if (response.data.user && response.data.user.passwordChangeRequired) {
            window.location.href = '/account/change-password';
          } else {
            window.location.href = from;
          }

          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('Login error:', error);
        setToken(null);
        return false;
      }
    },
    [],
  );

  const { mutateAsync } = useAuthControllerRegister({ mutation: {} });

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      return mutateAsync({
        data: {
          email,
          password,
          ...(name && { name }),
        },
      })
        .then(res => {
          const { data } = res;
          if (data.access_token) {
            localStorage.setItem(TOKEN_KEY, data.access_token);

            setToken(data.access_token);
            window.location.href = '/onboarding';
            return true;
          }
          return false;
        })
        .catch(error => {
          console.error('Registration error:', error);
          return false;
        });
    },
    [mutateAsync],
  );

  const logout = useCallback(() => {
    setToken(null);
    window.location.href = '/login';
  }, []);

  const value = useMemo(
    () => ({ token, login, register, logout, isLoggedIn }),
    [token, login, register, logout, isLoggedIn],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
