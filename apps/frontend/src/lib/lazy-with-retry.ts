import { lazy } from 'react';

type ComponentModule = { default: React.ComponentType<unknown> };

export function lazyWithRetry<T extends ComponentModule>(
  importFn: () => Promise<T>,
) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch {
      // Retry once with a cache-busting query param
      try {
        return await importFn();
      } catch {
        // If retry also fails, try a guarded page reload
        const lastReload = Number(
          sessionStorage.getItem('last_chunk_reload') || '0',
        );
        if (Date.now() - lastReload > 10_000) {
          sessionStorage.setItem('last_chunk_reload', String(Date.now()));
          window.location.reload();
        }
        // Re-throw so React error boundary can handle it
        throw new Error('Failed to load page module after retry');
      }
    }
  });
}
