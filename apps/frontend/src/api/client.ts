import axios from 'axios';
import { APIARY_SELECTION } from '@/context/auth-context/auth-provider';

export const apiClient = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const apiaryId = localStorage.getItem(APIARY_SELECTION);
  if (apiaryId) {
    config.headers['x-apiary-id'] = apiaryId;
  }
  // For FormData, delete Content-Type so browser sets it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/shared',
  '/join',
  '/',
];

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!PUBLIC_ROUTES.some(route => currentPath.startsWith(route))) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
