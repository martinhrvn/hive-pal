import { lazy } from 'react';

type ComponentModule = { default: React.ComponentType<unknown> };

export function lazyWithRetry<T extends ComponentModule>(
  importFn: () => Promise<T>,
) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch {
      // Import failed — likely a stale chunk from a previous deploy.
      // Trigger a guarded page reload so the browser fetches fresh HTML.
      const lastReload = Number(
        sessionStorage.getItem('last_chunk_reload') || '0',
      );
      if (Date.now() - lastReload > 30_000) {
        sessionStorage.setItem('last_chunk_reload', String(Date.now()));
        window.location.reload();
      }
      // Re-throw so React error boundary can handle it
      throw new Error('Failed to load page module');
    }
  });
}
