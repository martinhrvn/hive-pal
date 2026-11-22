import { isAxiosError } from 'axios';

/** The `message` of an error response body, joined if the API sent several. */
function responseMessage(data: unknown): string | undefined {
  if (typeof data === 'string') return data;
  if (typeof data !== 'object' || data === null) return undefined;
  const { message } = data as { message?: string | string[] };
  return Array.isArray(message) ? message.join(', ') : message;
}

/**
 * Pull the backend message out of an Axios error so a toast shows e.g. "No
 * active hiveinside firmware release" instead of "Request failed with status
 * code 404".
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    return responseMessage(error.response?.data) || error.message || fallback;
  }
  return error instanceof Error ? error.message || fallback : fallback;
}
