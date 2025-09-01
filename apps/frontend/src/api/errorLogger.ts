import * as Sentry from '@sentry/react';
import { AxiosError } from 'axios';

interface ApiError {
  endpoint: string;
  method?: string;
  status?: number;
  message?: string;
  data?: unknown;
  userId?: string;
}

export function logApiError(
  error: unknown,
  endpoint: string,
  method = 'unknown',
): void {
  const apiError: ApiError = {
    endpoint,
    method,
  };

  if (error instanceof AxiosError) {
    apiError.status = error.response?.status;
    apiError.message = error.response?.data?.message || error.message;
    apiError.data = error.response?.data;
  } else if (error instanceof Error) {
    apiError.message = error.message;
  } else {
    apiError.message = 'Unknown error';
  }

  // Add additional context
  const tags: Record<string, string> = {
    api_endpoint: endpoint,
    api_method: method,
    error_type: 'api_error',
  };

  if (apiError.status) {
    tags.status_code = apiError.status.toString();
  }

  Sentry.withScope(scope => {
    scope.setTags(tags);
    scope.setContext('api_error', {
      endpoint: apiError.endpoint,
      method: apiError.method,
      status: apiError.status,
      response_data: apiError.data,
    });

    // Capture the error
    Sentry.captureException(
      error instanceof Error
        ? error
        : new Error(apiError.message || 'API Error'),
    );
  });

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.error('API Error:', apiError, error);
  }
}
