import axios from 'axios';
import {
  APIARY_SELECTION,
  VIEW_ALL_APIARIES,
} from '@/context/auth-context/auth-provider';

// Reserved x-apiary-id value that puts the backend into the cross-apiary read
// mode (see ApiaryContextGuard). Only valid for GET requests.
const ALL_APIARIES_HEADER = 'all';

// Endpoints whose backend handlers opt into the cross-apiary "view all" mode
// (via @AllowAllApiaries). Only these receive x-apiary-id: all; every other
// request falls back to the concrete selected apiary so it keeps working while
// more endpoints gain all-apiaries support. Keep in sync with the backend.
const VIEW_ALL_ENDPOINTS = [
  '/api/hives',
  '/api/inspections',
  '/api/todos',
  '/api/queens',
];

const supportsViewAll = (url: string | undefined) =>
  !!url && VIEW_ALL_ENDPOINTS.some(endpoint => url.startsWith(endpoint));

export const apiClient = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  // If the caller already set an explicit x-apiary-id, respect it. This is how
  // cross-apiary writes work in "view all" mode: the mutation supplies the
  // concrete target apiary (from the resource or form) as an override.
  const hasExplicitApiary = config.headers['x-apiary-id'] != null;

  if (!hasExplicitApiary) {
    const method = (config.method ?? 'get').toUpperCase();
    const viewAll = localStorage.getItem(VIEW_ALL_APIARIES) === 'true';
    const apiaryId = localStorage.getItem(APIARY_SELECTION);

    if (method === 'GET' && viewAll && supportsViewAll(config.url)) {
      // Cross-apiary read: return data for every apiary the user has access to.
      config.headers['x-apiary-id'] = ALL_APIARIES_HEADER;
    } else if (apiaryId) {
      // Single-apiary read, or any write (writes always target one concrete
      // apiary — the currently selected one by default).
      config.headers['x-apiary-id'] = apiaryId;
    }
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
