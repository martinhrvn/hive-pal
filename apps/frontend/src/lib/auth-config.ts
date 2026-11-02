// SSO / login-method settings, provided at runtime by the backend via /env.js
// (derived from its OIDC_*, GOOGLE_* and FACEBOOK_* env vars) with a
// build-time VITE_* fallback.
const readEnv = (key: string): string | undefined =>
  (typeof window !== 'undefined' ? window.ENV?.[key] : undefined) ||
  (import.meta.env[key] as string | undefined);

const readBool = (key: string, fallback: boolean): boolean => {
  const value = readEnv(key);
  return value === undefined || value === '' ? fallback : value === 'true';
};

export const SOCIAL_PROVIDER_IDS = ['google', 'facebook'] as const;

export type SocialProviderId = (typeof SOCIAL_PROVIDER_IDS)[number];

const readSocialProviders = (): SocialProviderId[] => {
  const enabled = (readEnv('VITE_SOCIAL_PROVIDERS') ?? '').split(',');
  return SOCIAL_PROVIDER_IDS.filter(id => enabled.includes(id));
};

export const getAuthConfig = () => {
  const oidcEnabled = readBool('VITE_OIDC_ENABLED', false);
  return {
    oidcEnabled,
    oidcProviderId: readEnv('VITE_OIDC_PROVIDER_ID') || 'authentik',
    oidcButtonLabel: readEnv('VITE_OIDC_BUTTON_LABEL') || '',
    oidcAllowSignup: oidcEnabled && readBool('VITE_OIDC_ALLOW_SIGNUP', true),
    localLoginEnabled:
      !oidcEnabled || readBool('VITE_LOCAL_LOGIN_ENABLED', true),
    socialProviders: readSocialProviders(),
  };
};

/** Whether any SSO button (OIDC, Google, Facebook) is offered on the page. */
export const hasSsoOptions = (mode: 'signIn' | 'signUp') => {
  const { oidcEnabled, oidcAllowSignup, socialProviders } = getAuthConfig();
  const oidcShown = mode === 'signUp' ? oidcAllowSignup : oidcEnabled;
  return oidcShown || socialProviders.length > 0;
};
