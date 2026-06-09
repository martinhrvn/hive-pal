---
sidebar_position: 2
title: Docker Setup
description: Deploy Hive-Pal with a single Docker container and PostgreSQL. Covers the compose file, automatic migrations, SSL, and production tips.
keywords: [hive-pal docker, docker compose setup, self-hosted beekeeping, single container deployment]
---

# Docker Setup

Hive-Pal runs as a **single container** that serves both the API and the web app. A production deployment is just two services: the app and PostgreSQL.

## Quick Start

Create a `docker-compose.yaml`:

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
      BETTER_AUTH_URL: https://hive.example.com
      FRONTEND_URL: https://hive.example.com
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: changeme123
      STORAGE_TYPE: local
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

Then start it:

```bash
docker compose up -d
```

The app is available on port `80`. For the full environment-variable reference see [Configuration](./configuration).

## Which Compose File Should I Use?

The repository ships several compose files for different scenarios. **For a normal self-hosted deployment, use `docker-compose.prod.yaml`** (or the Traefik variant if you want automatic HTTPS). The compose block in [Quick Start](#quick-start) above is a trimmed version of it.

### Deployment files (repository root)

| File | Use it for | App image | Notable host ports |
|------|------------|-----------|--------------------|
| `docker-compose.prod.yaml` | **Production** — the standard self-hosted deployment | Prebuilt `ghcr.io/martinhrvn/hive-pal:latest` | App `80` → `3000` |
| `docker-compose.traefik.yaml` | Production behind **Traefik** with automatic Let's Encrypt TLS | Prebuilt image | Traefik `80` / `443` → app `3000` |
| `docker-compose.yaml` | **Building the image from source** and running it | Built locally from `Dockerfile` | App `3000`, DB `6543` → `5432` |
| `docker-compose.preview.yml` | Preview / staging environment, built from source | Built locally from `Dockerfile` | App `3000` |
| `docker-compose.local.yaml` | **Legacy** split build (separate frontend + backend images) — superseded by the single container | Two locally-built images | DB `6543` → `5432` |

:::note Why PostgreSQL maps to 6543
The build/development compose files publish PostgreSQL as `6543:5432` so it doesn't clash with a PostgreSQL already running on your machine. Inside the Docker network the database is always reached on `5432`. The production files don't publish the database to the host at all.
:::

### Optional add-on overlays

These are layered on top of a deployment with `-f` and are entirely optional:

| File | Adds |
|------|------|
| `apps/backend/docker-compose.yml` | Local **PostgreSQL + MinIO** for development (`pnpm db:up`) — MinIO console on `9001` |
| `apps/hivescale/docker-compose.hivescale.yaml` | An optional **HiveScale** backend sidecar — see [HiveScale](../user-guide/hivescale) |
| `apps/ai-app/docker-compose.worker.yml` | The **AI worker** (audio transcription + analysis) with a bundled Ollama model server (`11434`) — see [Audio & AI Transcription](../user-guide/audio-ai) |
| `apps/ai-app/docker-compose.ai.ollama.yml` | An alternative AI service + Ollama setup (`8008`, `11434`) |

For example, to run production with the HiveScale sidecar:

```bash
docker compose -f docker-compose.prod.yaml -f apps/hivescale/docker-compose.hivescale.yaml up -d
```

## How the Container Works

The image is a multi-stage build that compiles the frontend and backend, then copies the frontend's static bundle into the backend so a single NestJS process serves everything:

- **`/api/*`** → the NestJS REST API (and `/api/auth/*` for Better Auth).
- **everything else** → the React single-page app, served via `ServeStaticModule`.

On every container start, the entrypoint script:

1. Waits for the database to accept connections.
2. Runs `prisma migrate deploy` to apply any pending migrations.
3. Runs the admin seed script to create/promote the `ADMIN_EMAIL` user (idempotent; non-fatal if it fails).
4. Starts the application.

You don't need to run migrations manually — updating the image and restarting is enough.

## Persistent Data

Two things need persistent volumes:

| Path | Purpose |
|------|---------|
| `/var/lib/postgresql/data` | PostgreSQL database |
| `/data/uploads` | Local file storage (audio, photos) when `STORAGE_TYPE=local` |

If you use S3-compatible storage (`STORAGE_TYPE=s3`), only the database needs a volume. See [Configuration → File Storage](./configuration#file-storage).

## Production Deployment

### Reverse Proxy & SSL

Run Hive-Pal behind a reverse proxy (nginx, Caddy, Traefik) that terminates TLS and forwards to the app's port `3000`. Set `BETTER_AUTH_URL` and `FRONTEND_URL` to your public HTTPS URL, and set `PASSKEY_RP_ID` to your domain so passkeys work.

Example nginx server block:

```nginx
server {
    listen 443 ssl;
    server_name hive.example.com;

    ssl_certificate     /etc/ssl/certs/hive.example.com.pem;
    ssl_certificate_key /etc/ssl/private/hive.example.com.key;

    location / {
        proxy_pass http://127.0.0.1:8080;  # host port mapped to the app's 3000
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

When the frontend and API share a parent domain across subdomains, set `COOKIE_DOMAIN` (e.g. `.example.com`) so session cookies are shared.

### Health Checks

The app exposes a health endpoint at `/api/health`. The compose healthcheck already polls it; use the same endpoint for external uptime monitoring. See [Monitoring](./monitoring).

## Backups

Back up the PostgreSQL database regularly:

```bash
docker compose exec postgres pg_dump -U postgres beekeeper > backup.sql
```

Also back up the `uploads` volume if you use local storage. See [Backup & Restore](./backup-restore) for a full strategy.

## Updates

```bash
# Pull the latest image and recreate (migrations run automatically)
docker pull ghcr.io/martinhrvn/hive-pal:latest
docker compose up -d
```

## Troubleshooting

```bash
# View application logs
docker compose logs -f app

# Confirm the database is healthy
docker compose ps

# Restart the app
docker compose restart app
```

See the [Troubleshooting guide](../troubleshooting) for common issues such as login failures and database connection errors.
