import { createAuthClient } from 'better-auth/react';
import {
  magicLinkClient,
  adminClient,
  customSessionClient,
  inferAdditionalFields,
  genericOAuthClient,
} from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';

export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    passkeyClient(),
    adminClient(),
    genericOAuthClient(),
    inferAdditionalFields({
      user: {
        role: { type: 'string' },
        passwordChangeRequired: { type: 'boolean' },
        privacyPolicyConsent: { type: 'boolean' },
        newsletterConsent: { type: 'boolean' },
        consentRequired: { type: 'boolean' },
      },
    }),
    customSessionClient(),
  ],
});

export const { useSession, signIn, signUp, signOut } = authClient;
