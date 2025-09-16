import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl } from '@/api/client.ts';
import { decodeJwt, isTokenExpired } from '@/utils/jwt-utils';
import { AuthContext } from '@/context/auth-context/auth-context.ts';
import { useRegister } from '@/api/hooks/useAuth';

export const TOKEN_KEY = 'hive_pal_auth_token';
export const APIARY_SELECTION = 'hive_pal_apiary_selection';

interface AuthProviderProps {
  children: React.ReactNode;
}

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

  const { mutateAsync } = useRegister();

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      return mutateAsync({
        email,
        password,
        ...(name && { name }),
      })
        .then(data => {
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
    localStorage.removeItem(APIARY_SELECTION);
    window.location.href = '/login';
  }, []);

  const value = useMemo(
    () => ({ token, login, register, logout, isLoggedIn }),
    [token, login, register, logout, isLoggedIn],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
