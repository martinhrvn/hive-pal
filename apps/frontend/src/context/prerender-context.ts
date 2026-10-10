import { createContext, useContext } from 'react';
import type { PrerenderPayload } from '@/routes/public-routes';

/**
 * Describes the prerendered public page the document was produced for, or
 * `null` for the SPA shell and in dev. Provided by `entry.server.tsx` while
 * prerendering and by `entry.client.tsx` from the embedded payload, so the
 * server render and the hydrating client render see the same value.
 */
export const PrerenderContext = createContext<PrerenderPayload | null>(null);

export function usePrerender(): PrerenderPayload | null {
  return useContext(PrerenderContext);
}
