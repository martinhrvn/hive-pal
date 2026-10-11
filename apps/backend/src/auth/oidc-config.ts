// OIDC single sign-on (e.g. Authentik) configured entirely via environment
// variables. Users are matched to existing Hive Pal accounts by email.
//
//   OIDC_ISSUER / OIDC_DISCOVERY_URL   one of them is required to enable SSO.
//     Authentik: OIDC_ISSUER=https://auth.example.com/application/o/<app-slug>/
//   OIDC_CLIENT_ID, OIDC_CLIENT_SECRET required
//   OIDC_PROVIDER_ID     provider id used in the callback URL (default: authentik)
//                        → redirect URI: <BETTER_AUTH_URL>/api/auth/oauth2/callback/<id>
//   OIDC_SCOPES          space/comma separated (default: "openid profile email")
//   OIDC_BUTTON_LABEL    login button text (default: "Sign in with SSO")
//   OIDC_ALLOW_SIGNUP    create unknown users on first SSO login (default: true)
//   DISABLE_LOCAL_LOGIN  disable password, magic-link and passkey sign-in and
//                        email sign-up (default: false; only honoured while
//                        SSO is configured, to avoid locking everyone out)

export interface OidcConfig {
  enabled: boolean;
  providerId: string;
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  buttonLabel: string;
  allowSignup: boolean;
}

const parseBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value.trim() === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
};

export function buildDiscoveryUrl(issuer: string): string {
  return `${issuer.replace(/\/+$/, '')}/.well-known/openid-configuration`;
}

export function loadOidcConfig(
  env: NodeJS.ProcessEnv = process.env,
): OidcConfig {
  const issuer = env.OIDC_ISSUER?.trim() ?? '';
  const discoveryUrl =
    env.OIDC_DISCOVERY_URL?.trim() || (issuer ? buildDiscoveryUrl(issuer) : '');
  const clientId = env.OIDC_CLIENT_ID?.trim() ?? '';
  const clientSecret = env.OIDC_CLIENT_SECRET?.trim() ?? '';
  const scopes = (env.OIDC_SCOPES?.trim() || 'openid profile email')
    .split(/[\s,]+/)
    .filter(Boolean);

  return {
    enabled: !!(discoveryUrl && clientId && clientSecret),
    providerId: env.OIDC_PROVIDER_ID?.trim() || 'authentik',
    discoveryUrl,
    clientId,
    clientSecret,
    scopes,
    buttonLabel: env.OIDC_BUTTON_LABEL?.trim() || 'Sign in with SSO',
    allowSignup: parseBool(env.OIDC_ALLOW_SIGNUP, true),
  };
}

export function isLocalLoginDisabled(
  env: NodeJS.ProcessEnv = process.env,
  oidc: OidcConfig = loadOidcConfig(env),
): boolean {
  return oidc.enabled && parseBool(env.DISABLE_LOCAL_LOGIN, false);
}

// Better Auth endpoint paths (route templates, as seen in `ctx.path`) that make
// up "local" login. Blocked when DISABLE_LOCAL_LOGIN is active.
export const LOCAL_LOGIN_PATHS = new Set([
  '/sign-in/email',
  '/sign-up/email',
  '/sign-in/magic-link',
  '/magic-link/verify',
  '/request-password-reset',
  '/reset-password',
  '/reset-password/:token',
  '/passkey/generate-authenticate-options',
  '/passkey/verify-authentication',
]);
