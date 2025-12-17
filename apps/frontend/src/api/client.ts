import axios from 'axios';
import { APIARY_SELECTION, TOKEN_KEY } from '@/context/auth-context';
import { getEnvVariable } from '@/utils/get-env';

export const getApiUrl = (url: string) => {
  return `${getEnvVariable('VITE_API_URL') ?? 'http://localhost:3000'}${url}`;
};
export const createApiClient = (getToken: () => string | null) => {
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${getApiUrl(endpoint)}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // You might want to trigger a logout here
        throw new Error('Authentication expired');
      }
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  };

  return {
    get: <T>(endpoint: string) => fetchWithAuth(endpoint) as Promise<T>,

    post: <T>(endpoint: string, data: unknown) =>
      fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      }) as Promise<T>,

    put: <T>(endpoint: string, data: unknown) =>
      fetchWithAuth(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
      }) as Promise<T>,

    delete: <T>(endpoint: string) =>
      fetchWithAuth(endpoint, {
        method: 'DELETE',
      }) as Promise<T>,
  };
};

export const apiClient = axios.create({
  baseURL: `${getApiUrl(getEnvVariable('VITE_API_URL'))}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  const apiaryId = localStorage.getItem(APIARY_SELECTION);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (apiaryId) {
      config.headers['x-apiary-id'] = apiaryId;
    }
  }
  // For FormData, delete Content-Type so browser sets it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  config.baseURL = getApiUrl('');
  return config;
});

// List of public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/'];

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Only redirect to login if we're not already on a public page
      // This prevents redirect loops when fetching user preferences on public pages
      if (!PUBLIC_ROUTES.some(route => currentPath.startsWith(route))) {
        // Unauthorized, clear token and redirect to login
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
