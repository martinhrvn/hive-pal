import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiUrl } from '@/api/client.ts';
import { decodeJwt, isTokenExpired } from '@/utils/jwt-utils';

const TOKEN_KEY = 'hive_pal_auth_token';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  passwordChangeRequired?: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (
    username: string,
    password: string,
    from?: string,
  ) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<boolean>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

const USER_KEY = 'hive_pal_user';

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

  const [user, setUser] = useState<User | null>(() => {
    // Initialize user from token
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (storedToken && !isTokenExpired(storedToken)) {
      const decodedToken = decodeJwt(storedToken);

      if (decodedToken) {
        return {
          id: decodedToken.sub,
          email: decodedToken.email,
          role: decodedToken.role,
          passwordChangeRequired: decodedToken.passwordChangeRequired,
        };
      }
    }

    // Fallback to stored user data if token is not available
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
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
        const tokenUser = {
          id: decodedToken.sub,
          email: decodedToken.email,
          role: decodedToken.role,
          passwordChangeRequired: decodedToken.passwordChangeRequired,
        };

        setUser(tokenUser);

        localStorage.setItem(USER_KEY, JSON.stringify(tokenUser));
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
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }

    // Request interceptor to add token to all requests
    const requestInterceptor = axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // Response interceptor to handle 401 Unauthorized errors
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login page
          setToken(null);
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );

    // Clean up interceptors when component unmounts or token changes
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
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

          if (response.data.user) {
            setUser(response.data.user);
          }

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
        setUser(null);
        return false;
      }
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const response = await axios.post(getApiUrl('/api/auth/register'), {
          email,
          password,
          ...(name && { name }),
        });

        if (response.status >= 200 && response.status < 300) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('Registration error:', error);
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const value = useMemo(
    () => ({ token, user, login, register, logout, isLoggedIn }),
    [token, user, login, register, logout, isLoggedIn],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
