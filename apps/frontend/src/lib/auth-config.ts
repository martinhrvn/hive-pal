// SSO / login-method settings, provided at runtime by the backend via /env.js
// (derived from its OIDC_* env vars) with a build-time VITE_* fallback.
const readEnv = (key: string): string | undefined =>
  (typeof window !== 'undefined' ? window.ENV?.[key] : undefined) ||
  (import.meta.env[key] as string | undefined);

const readBool = (key: string, fallback: boolean): boolean => {
  const value = readEnv(key);
  return value === undefined || value === '' ? fallback : value === 'true';
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
  };
};
