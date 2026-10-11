---
sidebar_position: 4
title: Configuration
description: Complete environment-variable reference for Hive-Pal — database, Better Auth, email, file storage, HiveScale, and error tracking.
keywords: [hive-pal configuration, environment variables, better auth, smtp, s3 storage, self-hosting]
---

# Configuration

Hive-Pal is configured entirely through environment variables on the app container. This page is the complete reference.

## Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgres://postgres:postgres@postgres:5432/beekeeper` |
| `BETTER_AUTH_SECRET` | Secret used to sign Better Auth sessions/cookies. Use 32+ random chars: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public base URL where the app and `/api/auth/*` are served, e.g. `https://hive.example.com` |
| `FRONTEND_URL` | Public URL of the app. Used in email links and as a trusted auth origin |
| `ADMIN_EMAIL` | Initial admin account email (seeded on startup) |
| `ADMIN_PASSWORD` | Initial admin password (plaintext; hashed on first run) |

:::note Single-container deployments
Because the app serves the frontend and API from the same origin, you do **not** need to set `VITE_API_URL` or `API_URL` for the standard single-container deployment. Those are only relevant for split frontend/backend or local development setups.
:::

## Authentication

Hive-Pal authenticates with [Better Auth](https://www.better-auth.com/). Beyond the required `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PASSKEY_RP_ID` | WebAuthn relying-party ID for passkeys. Set to your domain in production | `localhost` |
| `COOKIE_DOMAIN` | Set when frontend and backend share a parent domain across subdomains (e.g. `.example.com`) | — |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | — |
| `JWT_SECRET` | Signs short-lived tokens for iCal calendar feeds, HiveScale proxy requests, and local-storage download URLs (see note below). Generate with `openssl rand -base64 32` | — |

:::info JWT_SECRET is not for login
`JWT_SECRET` is **not** used for user authentication (that's Better Auth). It only signs short-lived tokens for iCal calendar feeds, HiveScale proxy requests, and local-storage download URLs. Set it only if you use those features.
:::

### Single sign-on (OIDC / Authentik)

Hive-Pal can sign users in through any OpenID Connect provider. It has been designed with [Authentik](https://goauthentik.io/) in mind. SSO is enabled as soon as the issuer (or discovery URL), client ID and client secret are set.

| Variable | Description | Default |
|----------|-------------|---------|
| `OIDC_ISSUER` | Issuer URL of the provider. Authentik: `https://auth.example.com/application/o/<app-slug>/` | — |
| `OIDC_DISCOVERY_URL` | Full discovery URL; overrides the one derived from `OIDC_ISSUER` | `<OIDC_ISSUER>/.well-known/openid-configuration` |
| `OIDC_CLIENT_ID` | Client ID of the OAuth2/OpenID provider | — |
| `OIDC_CLIENT_SECRET` | Client secret of the OAuth2/OpenID provider | — |
| `OIDC_PROVIDER_ID` | Internal provider ID, used in the redirect URI | `authentik` |
| `OIDC_SCOPES` | Requested scopes (space- or comma-separated) | `openid profile email` |
| `OIDC_BUTTON_LABEL` | Text of the login button | `Sign in with SSO` |
| `OIDC_ALLOW_SIGNUP` | Create a Hive-Pal account on the first SSO login when no account with that email exists. With `false`, only existing users can sign in via SSO | `true` |
| `DISABLE_LOCAL_LOGIN` | Disable password, magic-link and passkey sign-in as well as email sign-up, so that only SSO remains. Ignored while SSO is not configured | `false` |

**How users are matched:** accounts are matched **by email address** (case-insensitive). The provider's email claim is trusted even when it doesn't send `email_verified=true`, so make sure users can't change their own email address in Authentik.

When SSO is linked implicitly to an existing account whose email was never verified (typically an account registered with a password), the password, passkeys and sessions of that account are removed. This prevents someone from pre-registering an account with another person's email and keeping access after that person's first SSO login. The owner keeps all data and can still set a password again via "Forgot password". Accounts with a verified email (older accounts, magic-link users), and accounts linked by their owner from **Settings → Single sign-on**, keep their password.

Users created through SSO are asked once to accept the privacy policy after their first login.

#### Authentik setup

1. In Authentik, go to **Applications → Providers** and create an **OAuth2/OpenID Provider**:
   - **Client type:** Confidential
   - **Redirect URIs (strict):** `<BETTER_AUTH_URL>/api/auth/oauth2/callback/authentik`, e.g. `https://hive.example.com/api/auth/oauth2/callback/authentik`. If you changed `OIDC_PROVIDER_ID`, use that value instead of `authentik`.
   - **Scopes:** keep the default `openid`, `email` and `profile` mappings.
2. Create an **Application** that uses this provider and note its **slug**. Bind users or groups to it to control who may sign in.
3. Configure Hive-Pal:

   ```bash
   OIDC_ISSUER=https://auth.example.com/application/o/<app-slug>/
   OIDC_CLIENT_ID=<client id>
   OIDC_CLIENT_SECRET=<client secret>
   OIDC_BUTTON_LABEL="Sign in with Authentik"
   # OIDC_ALLOW_SIGNUP=false     # only allow existing Hive-Pal users
   # DISABLE_LOCAL_LOGIN=true    # SSO only
   ```

4. Restart Hive-Pal. The login page now shows the SSO button.

:::tip
Keep local login enabled until you have confirmed that SSO works. Users with `ADMIN_EMAIL` get the admin role no matter how they sign in.
:::

## Email

Email powers magic-link sign-in and password-reset messages. Hive-Pal supports **Resend** or **SMTP** and auto-selects based on what's configured. Without email, password and passkey login still work, but magic links and password resets do not.

| Variable | Description |
|----------|-------------|
| `MAIL_PROVIDER` | Force a provider: `resend`, `smtp`, or `none`. Auto-selects if unset |
| `FROM_EMAIL` | Sender address for outgoing mail |
| `RESEND_API_KEY` | API key for the Resend provider |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port (e.g. `587` or `465`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password (for Gmail, use an App Password) |
| `SMTP_SECURE` | `true` for port 465 (SSL), `false` for 587 (TLS) |
| `SMTP_REJECT_UNAUTHORIZED` | Reject invalid TLS certs. Default `true`; set `false` for self-signed certs |

## File Storage

Hive-Pal stores uploaded audio recordings and photos in either the local filesystem or S3-compatible object storage. Choose with `STORAGE_TYPE`.

| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_TYPE` | `local` or `s3` | `s3` |
| `STORAGE_LOCAL_PATH` | Directory for local storage. In Docker this is backed by the `uploads` volume | `/data/uploads` |
| `AUDIO_MAX_FILE_SIZE` | Max upload size in bytes | `52428800` (50 MB) |

### Local storage

The simplest option — no external services. Mount a volume at `/data/uploads`:

```bash
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=/data/uploads
```

Download URLs are signed, time-limited paths (HMAC-SHA256 with `JWT_SECRET`), so they behave like S3 pre-signed URLs.

### S3-compatible storage

Use AWS S3, MinIO, or any S3-compatible service:

```bash
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com  # or your MinIO endpoint
S3_REGION=us-east-1
S3_BUCKET=hivepal-uploads
S3_ACCESS_KEY_ID=your_key
S3_SECRET_ACCESS_KEY=your_secret
```

## HiveScale Integration

Hive-Pal can proxy live data from a separate HiveScale backend.

| Variable | Description |
|----------|-------------|
| `HIVESCALE_API_BASE_URL` | Base URL of the HiveScale backend |
| `HIVESCALE_SERVICE_API_KEY` | Shared service key used by Hive-Pal to call HiveScale |
| `JWT_SECRET` | Signs the per-user tokens Hive-Pal forwards to HiveScale |

The `HIVESCALE_SERVICE_API_KEY` value must match `HIVEPAL_SERVICE_API_KEY` on the HiveScale backend, and `JWT_SECRET` must match HiveScale's `HIVEPAL_JWT_SECRET` so it can verify the forwarded user tokens. HiveScale remains the source of truth for measurements, device roles, off-grid telemetry, and calibration; Hive-Pal only proxies authenticated user requests. See the [HiveScale guide](../user-guide/hivescale).

## Error Tracking (Optional)

Configure [Sentry](https://sentry.io/) to monitor errors in production.

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Backend Sentry DSN |
| `SENTRY_ENVIRONMENT` | Backend environment label (e.g. `production`) |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN |
| `VITE_SENTRY_ENVIRONMENT` | Frontend environment label |

## Other

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Runtime mode | `production` |

## Best Practices

- Never commit secrets to version control — use an `.env` file or your orchestrator's secret store.
- Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32` and keep it stable; changing it invalidates existing sessions.
- Set `BETTER_AUTH_URL`, `FRONTEND_URL`, and `PASSKEY_RP_ID` to your real public domain before going live. `BETTER_AUTH_URL` also determines the SSO redirect URI.
- Configure email so users can reset passwords and use magic links.
