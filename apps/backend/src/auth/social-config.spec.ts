import { enabledSocialProviders, loadSocialProviders } from './social-config';
import { buildEnvConfig } from '../env.controller';

describe('loadSocialProviders', () => {
  it('is empty without configuration', () => {
    expect(loadSocialProviders({})).toEqual({});
  });

  it('skips a provider whose secret is missing', () => {
    expect(
      loadSocialProviders({
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: ' ',
      }),
    ).toEqual({});
  });

  it('loads every fully configured provider', () => {
    const config = loadSocialProviders({
      GOOGLE_CLIENT_ID: ' google-id ',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      FACEBOOK_CLIENT_ID: 'fb-id',
      FACEBOOK_CLIENT_SECRET: 'fb-secret',
    });
    expect(config).toEqual({
      google: { clientId: 'google-id', clientSecret: 'google-secret' },
      facebook: { clientId: 'fb-id', clientSecret: 'fb-secret' },
    });
    expect(enabledSocialProviders(config)).toEqual(['google', 'facebook']);
  });
});

describe('buildEnvConfig social providers', () => {
  it('lists the enabled providers without their secrets', () => {
    const config = buildEnvConfig({
      FACEBOOK_CLIENT_ID: 'fb-id',
      FACEBOOK_CLIENT_SECRET: 'fb-secret',
    });
    expect(config.VITE_SOCIAL_PROVIDERS).toBe('facebook');
    expect(JSON.stringify(config)).not.toContain('fb-secret');
  });

  it('is empty when no provider is configured', () => {
    expect(buildEnvConfig({}).VITE_SOCIAL_PROVIDERS).toBe('');
  });
});
