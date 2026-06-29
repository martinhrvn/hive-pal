---
title: Logging In
description: Sign in to Hive-Pal with a password, a passwordless magic link, or a passkey. Learn how each method works and what your server needs to support them.
keywords: [hive-pal login, magic link sign in, passkey, webauthn, passwordless login, beekeeping app account]
---

import Head from '@docusaurus/Head';

<Head>
  <script type="application/ld+json">
    {JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Which Hive-Pal sign-in method is most secure?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Passkeys are the strongest option — phishing-resistant with nothing to leak. Magic links avoid stored passwords. Password login works everywhere.',
          },
        },
        {
          '@type': 'Question',
          name: 'My magic link or reset email never arrives — why?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Your server needs a working mail provider (SMTP or Resend). Configure it and verify FROM_EMAIL is an address your provider is allowed to send from.',
          },
        },
        {
          '@type': 'Question',
          name: 'My passkey will not register. What is wrong?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WebAuthn requires a secure context: HTTPS in production (or localhost in development), and the server PASSKEY_RP_ID must match your domain.',
          },
        },
      ],
    })}
  </script>
</Head>

# Logging In

Hive-Pal uses [Better Auth](https://www.better-auth.com/) and supports three ways to sign in. Pick whichever suits you — they all reach the same account.

## Email & Password

The classic method, always available.

1. Open the login page and enter your **email** and **password**.
2. Sign in.

Forgot your password? Use **Forgot password** to receive a reset link by email (requires your server to have email configured).

## Magic Link

Passwordless sign-in by email — no password to remember.

1. Choose **Magic link** on the login page.
2. Enter your email; Hive-Pal sends a one-time sign-in link.
3. Open the link to be signed in. Links are short-lived for security.

Magic links require a configured mail provider (SMTP or Resend). See [Configuration → Email](../self-hosting/configuration#email).

## Passkeys

Sign in with your device's biometrics or a hardware security key (WebAuthn) — fast and phishing-resistant.

1. Choose **Passkey** on the login page.
2. Authenticate with your fingerprint, face, device PIN, or security key.

Passkeys require a **secure context**: HTTPS in production (or `localhost` in development), and the server's `PASSKEY_RP_ID` set to your domain. See [Configuration → Authentication](../self-hosting/configuration#authentication).

## Creating an Account

1. From the login page, choose **Sign Up**.
2. Enter your email and password.
3. Accept the privacy policy (required); newsletter opt-in is optional.
4. Create your account.

On a fresh self-hosted install, the first admin account is created automatically from the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you configured — see the [Installation Guide](../installation).

## FAQ

**Which method is most secure?**
Passkeys are the strongest option (phishing-resistant and nothing to leak). Magic links avoid stored passwords. Password login works everywhere.

**Magic link or reset email never arrives — why?**
Your server needs a working mail provider. See [Troubleshooting](../troubleshooting#magic-links-or-password-resets-not-arriving).

**My passkey won't register.**
You must be on HTTPS (or `localhost`) and the server's `PASSKEY_RP_ID` must match your domain. See [Troubleshooting](../troubleshooting#passkeys-not-working).
