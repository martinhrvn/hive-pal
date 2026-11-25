import { useSyncExternalStore } from 'react';
import { isSignUpAvailable } from '@/lib/auth-config';

const subscribe = () => () => {};

/**
 * Whether visitors can create an account (see DISABLE_REGISTRATION).
 *
 * Public pages are prerendered without the runtime /env.js config, so the
 * server snapshot assumes sign-up is open; React swaps in the real value right
 * after hydration instead of reporting a mismatch.
 */
export const useSignUpAvailable = (): boolean =>
  useSyncExternalStore(subscribe, isSignUpAvailable, () => true);
