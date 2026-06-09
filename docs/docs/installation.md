---
sidebar_position: 2
description: Install Hive-Pal on your own server with a single Docker container and PostgreSQL. Covers the compose file, required environment variables, and first login.
keywords: [hive-pal installation, docker setup, self-hosted beekeeping, better auth, single container]
---

import Head from '@docusaurus/Head';

<Head>
  <script type="application/ld+json">
    {JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Install Hive-Pal with Docker',
      description:
        'Deploy Hive-Pal as a single Docker container with a PostgreSQL database.',
      step: [
        { '@type': 'HowToStep', name: 'Create a docker-compose.yaml', text: 'Define the single-container app service (ghcr.io/martinhrvn/hive-pal:latest) and a PostgreSQL 14 service, with the required environment variables.' },
        { '@type': 'HowToStep', name: 'Start the application', text: 'Run docker compose up -d. The app waits for the database, runs migrations, and seeds the admin user automatically.' },
        { '@type': 'HowToStep', name: 'Access the application', text: 'Open the app in your browser and log in with the admin credentials you configured.' },
      ],
    })}
  </script>
</Head>

# Installation Guide

Hive-Pal ships as a **single Docker image** (`ghcr.io/martinhrvn/hive-pal:latest`) that bundles the NestJS API and the React frontend together — the backend serves the web app as static files on port `3000`. You only need to run two containers: the app and a PostgreSQL database.

## Prerequisites

- Docker and Docker Compose
- A PostgreSQL 14 database (the compose file below runs one for you)

## Docker Installation (Recommended)

### 1. Create a docker-compose.yaml file

```yaml
services:
  app:
    image: ghcr.io/martinhrvn/hive-pal:latest
    ports:
      - '80:3000'
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/beekeeper
      BETTER_AUTH_SECRET: replace_me_with_a_random_string
      BETTER_AUTH_URL: http://localhost
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: changeme123
      FRONTEND_URL: http://localhost
      STORAGE_TYPE: local # 'local' for filesystem, 's3' for S3-compatible storage
    volumes:
      - uploads:/data/uploads
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: beekeeper
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d beekeeper']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  uploads:
```

:::tip Generate a secret
`BETTER_AUTH_SECRET` signs your login sessions. Generate a strong value with:

```bash
openssl rand -base64 32
```
:::

### 2. Start the application

```bash
docker compose up -d
```

On startup the app container automatically waits for PostgreSQL, runs database migrations (`prisma migrate deploy`), and creates/promotes the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 3. Access the application

Open `http://localhost` and log in with the admin credentials you configured. From there you can register additional users, or sign in with a magic link or passkey once email is configured (see [Authentication](#authentication)).

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret used to sign Better Auth sessions/cookies (32+ chars; `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Public base URL where the app (and `/api/auth/*`) is served, e.g. `https://hive.example.com` |
| `ADMIN_EMAIL` | Initial admin account email |
| `ADMIN_PASSWORD` | Initial admin password (plaintext; hashed on first run) |
| `FRONTEND_URL` | Public URL of the app — used in email links and as a trusted origin |

For the complete reference, including authentication, email, storage, and integrations, see [Configuration](./self-hosting/configuration).

## Authentication

Hive-Pal uses [Better Auth](https://www.better-auth.com/) for authentication, exposed under `/api/auth/*`. Three sign-in methods are supported:

- **Email & password** — always available.
- **Magic link** — passwordless email sign-in. Requires email to be configured (SMTP or Resend).
- **Passkeys (WebAuthn)** — biometric / hardware-key sign-in. Set `PASSKEY_RP_ID` to your domain in production (defaults to `localhost`).

Magic links and password resets need a working mail provider. Configure SMTP or Resend as described in [Configuration → Email](./self-hosting/configuration#email).

## Optional HiveScale Integration

To show live HiveScale device data inside Hive-Pal, run a HiveScale backend and set these variables on the app:

```bash
HIVESCALE_API_BASE_URL=https://hivescale.example.com
HIVESCALE_SERVICE_API_KEY=a-long-random-shared-secret
```

The same secret must be configured on HiveScale as `HIVEPAL_SERVICE_API_KEY`. Once connected, the HiveScale page can claim devices and display weight, temperature, battery, solar, and cellular telemetry. See the [HiveScale guide](./user-guide/hivescale).

## Manual Installation (Development)

For local development without Docker:

```bash
# Clone the repository
git clone https://github.com/martinhrvn/hive-pal.git
cd hive-pal

# Install dependencies
pnpm install

# Start the development servers (frontend + backend)
pnpm dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:3000`. See [Manual Setup](./self-hosting/manual-setup) for full details including the database.

## Updating Hive-Pal

```bash
# Pull the latest image
docker pull ghcr.io/martinhrvn/hive-pal:latest

# Recreate the containers (migrations run automatically on start)
docker compose up -d
```

Always [back up your database](./self-hosting/backup-restore) before updating.
