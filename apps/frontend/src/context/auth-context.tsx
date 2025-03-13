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

const TOKEN_KEY = 'hive_pal_auth_token';

interface AuthContextType {
  token: string | null;
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
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem(TOKEN_KEY);
  });

  const isAuthenticated = !!token;

  // Set up axios interceptors for authentication and handling 401 errors
  useEffect(() => {
    // Setup token in localStorage
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
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
          window.location.href = from;
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
    window.location.href = '/login';
  }, []);

  const value = useMemo(
    () => ({ token, login, register, logout, isAuthenticated }),
    [token, login, register, logout, isAuthenticated],
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
