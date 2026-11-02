// Google and Facebook sign-in, each enabled by setting its client id and
// secret. Users are matched to existing Hive Pal accounts by email.
//
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
//   FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET   (Facebook app id and secret)
//
// Redirect URI to register with the provider:
//   <BETTER_AUTH_URL>/api/auth/callback/google (or /facebook)

export const SOCIAL_PROVIDER_IDS = ['google', 'facebook'] as const;

export type SocialProviderId = (typeof SOCIAL_PROVIDER_IDS)[number];

export interface SocialProviderCredentials {
  clientId: string;
  clientSecret: string;
}

/** Credentials of the configured providers; unconfigured ones are absent. */
export type SocialProvidersConfig = Partial<
  Record<SocialProviderId, SocialProviderCredentials>
>;

export function loadSocialProviders(
  env: NodeJS.ProcessEnv = process.env,
): SocialProvidersConfig {
  const config: SocialProvidersConfig = {};
  for (const id of SOCIAL_PROVIDER_IDS) {
    const prefix = id.toUpperCase();
    const clientId = env[`${prefix}_CLIENT_ID`]?.trim() ?? '';
    const clientSecret = env[`${prefix}_CLIENT_SECRET`]?.trim() ?? '';
    if (clientId && clientSecret) config[id] = { clientId, clientSecret };
  }
  return config;
}

export const enabledSocialProviders = (
  config: SocialProvidersConfig,
): SocialProviderId[] => SOCIAL_PROVIDER_IDS.filter((id) => !!config[id]);
