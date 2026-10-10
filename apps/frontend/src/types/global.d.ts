import type { PrerenderPayload } from '@/routes/public-routes';

declare global {
  interface Window {
    ENV?: {
      [key: string]: string;
    };
    /** Embedded by prerendered public pages; see entry.server.tsx. */
    __HP_PRERENDER__?: PrerenderPayload;
  }
}

export {};
