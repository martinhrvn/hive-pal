import {
  buildDiscoveryUrl,
  isLocalLoginDisabled,
  loadOidcConfig,
} from './oidc-config';
import { buildEnvConfig } from '../env.controller';

const authentikEnv = {
  OIDC_ISSUER: 'https://auth.example.com/application/o/hive-pal/',
  OIDC_CLIENT_ID: 'client',
  OIDC_CLIENT_SECRET: 'secret',
};

describe('loadOidcConfig', () => {
  it('is disabled without configuration', () => {
    expect(loadOidcConfig({}).enabled).toBe(false);
  });

  it('is disabled when the client secret is missing', () => {
    expect(
      loadOidcConfig({ ...authentikEnv, OIDC_CLIENT_SECRET: '' }).enabled,
    ).toBe(false);
  });

  it('derives the discovery URL from the Authentik issuer', () => {
    const config = loadOidcConfig(authentikEnv);
    expect(config.enabled).toBe(true);
    expect(config.discoveryUrl).toBe(
      'https://auth.example.com/application/o/hive-pal/.well-known/openid-configuration',
    );
    expect(config.providerId).toBe('authentik');
    expect(config.scopes).toEqual(['openid', 'profile', 'email']);
    expect(config.allowSignup).toBe(true);
  });

  it('prefers an explicit discovery URL and parses options', () => {
    const config = loadOidcConfig({
      ...authentikEnv,
      OIDC_DISCOVERY_URL: 'https://idp/.well-known/openid-configuration',
      OIDC_SCOPES: 'openid,email',
      OIDC_ALLOW_SIGNUP: 'false',
      OIDC_BUTTON_LABEL: 'Login with Authentik',
    });
    expect(config.discoveryUrl).toBe(
      'https://idp/.well-known/openid-configuration',
    );
    expect(config.scopes).toEqual(['openid', 'email']);
    expect(config.allowSignup).toBe(false);
    expect(config.buttonLabel).toBe('Login with Authentik');
  });

  it('strips trailing slashes when building the discovery URL', () => {
    expect(buildDiscoveryUrl('https://idp/app//')).toBe(
      'https://idp/app/.well-known/openid-configuration',
    );
  });
});

describe('isLocalLoginDisabled', () => {
  it('is ignored while OIDC is not configured', () => {
    expect(isLocalLoginDisabled({ DISABLE_LOCAL_LOGIN: 'true' })).toBe(false);
  });

  it('applies when OIDC is configured', () => {
    expect(
      isLocalLoginDisabled({ ...authentikEnv, DISABLE_LOCAL_LOGIN: 'true' }),
    ).toBe(true);
    expect(isLocalLoginDisabled(authentikEnv)).toBe(false);
  });
});

describe('buildEnvConfig SSO flags', () => {
  it('exposes SSO settings without secrets', () => {
    const config = buildEnvConfig({
      ...authentikEnv,
      OIDC_ALLOW_SIGNUP: 'false',
    });
    expect(config).toMatchObject({
      VITE_OIDC_ENABLED: 'true',
      VITE_OIDC_PROVIDER_ID: 'authentik',
      VITE_OIDC_BUTTON_LABEL: 'Sign in with SSO',
      VITE_OIDC_ALLOW_SIGNUP: 'false',
      VITE_LOCAL_LOGIN_ENABLED: 'true',
    });
    expect(JSON.stringify(config)).not.toContain('secret');
  });

  it('reports SSO as disabled by default', () => {
    expect(buildEnvConfig({})).toMatchObject({
      VITE_OIDC_ENABLED: 'false',
      VITE_OIDC_ALLOW_SIGNUP: 'false',
      VITE_LOCAL_LOGIN_ENABLED: 'true',
    });
  });
});
