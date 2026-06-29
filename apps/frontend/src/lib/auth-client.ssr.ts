// SSR/prerender stand-in for the better-auth client. better-auth's `useSession`
// is not server-render safe (no getServerSnapshot) and pulls in browser-only
// passkey/WebAuthn code, so the SSR build aliases `@/lib/auth-client` to this
// module (see vite.config.ts). Public pages only ever render their logged-out
// state during prerendering, so a static "no session" stub is sufficient.

type Noop = (...args: unknown[]) => Promise<never>;

const rejected: Noop = () =>
  Promise.reject(new Error('auth-client is unavailable during prerender'));

export const authClient = {
  signIn: rejected,
  signUp: rejected,
  signOut: rejected,
};

export function useSession() {
  return { data: null, isPending: false, error: null } as const;
}

export const signIn = rejected;
export const signUp = rejected;
export const signOut = rejected;
