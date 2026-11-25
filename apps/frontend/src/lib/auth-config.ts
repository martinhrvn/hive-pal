// SSO / login-method settings, provided at runtime by the backend via /env.js
// (derived from its OIDC_*, GOOGLE_*, FACEBOOK_* and DISABLE_REGISTRATION env
// vars) with a build-time VITE_* fallback.
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
  const enabled = new Set((readEnv('VITE_SOCIAL_PROVIDERS') ?? '').split(','));
  return SOCIAL_PROVIDER_IDS.filter(id => enabled.has(id));
};

export const getAuthConfig = () => {
  const oidcEnabled = readBool('VITE_OIDC_ENABLED', false);
  const localLoginEnabled =
    !oidcEnabled || readBool('VITE_LOCAL_LOGIN_ENABLED', true);
  // DISABLE_REGISTRATION: closes email, magic-link, Google and Facebook
  // sign-up. OIDC sign-up keeps following OIDC_ALLOW_SIGNUP.
  const registrationEnabled = readBool('VITE_REGISTRATION_ENABLED', true);
  return {
    oidcEnabled,
    oidcProviderId: readEnv('VITE_OIDC_PROVIDER_ID') || 'authentik',
    oidcButtonLabel: readEnv('VITE_OIDC_BUTTON_LABEL') || '',
    oidcAllowSignup: oidcEnabled && readBool('VITE_OIDC_ALLOW_SIGNUP', true),
    localLoginEnabled,
    registrationEnabled,
    /** Whether the email + password sign-up form is offered. */
    localSignUpEnabled: localLoginEnabled && registrationEnabled,
    socialProviders: readSocialProviders(),
  };
};

/** The social providers (Google, Facebook) offered for the given mode. */
export const getSocialProviders = (
  mode: 'signIn' | 'signUp',
): SocialProviderId[] => {
  const { socialProviders, registrationEnabled } = getAuthConfig();
  return mode === 'signUp' && !registrationEnabled ? [] : socialProviders;
};

/** Whether any SSO button (OIDC, Google, Facebook) is offered on the page. */
export const hasSsoOptions = (mode: 'signIn' | 'signUp') => {
  const { oidcEnabled, oidcAllowSignup } = getAuthConfig();
  const oidcShown = mode === 'signUp' ? oidcAllowSignup : oidcEnabled;
  return oidcShown || getSocialProviders(mode).length > 0;
};

/** Whether new visitors can create an account in any way. */
export const isSignUpAvailable = () =>
  getAuthConfig().localSignUpEnabled || hasSsoOptions('signUp');
