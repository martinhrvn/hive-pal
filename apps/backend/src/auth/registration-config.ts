import { parseBool } from './env-bool';

// Public self-registration, configured via environment variables.
//
//   DISABLE_REGISTRATION  stop new accounts from signing up with email and
//                         password, magic link, Google or Facebook
//                         (default: false). Admins can still create users
//                         from Admin → Users. OIDC sign-up is separate and
//                         follows OIDC_ALLOW_SIGNUP, so an identity provider
//                         can keep provisioning accounts.

export function isRegistrationDisabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return parseBool(env.DISABLE_REGISTRATION, false);
}
