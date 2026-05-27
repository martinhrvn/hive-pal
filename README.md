# Hive Pal 🐝

[![Tests](https://github.com/martinhrvn/hive-pal/actions/workflows/check.yml/badge.svg)](https://github.com/martinhrvn/hive-pal/actions/workflows/check.yml)

A modern beekeeping management application designed for both mobile and desktop use. Track your apiaries, hives, inspections, and more with an intuitive interface.

**⚠️ IMPORTANT: This project is very much a Work In Progress. The API is mostly stable but there may be breaking changes.**

## Features

- **Apiary Management**: Create and track multiple apiaries with location information
- **Hive Tracking**: Monitor hives, their status, and configuration
- **Inspection Workflows**: Record detailed inspections with observations and actions
- **Queen Management**: Track queen lineage and replacement history
- **Apiary Sharing**: Invite other users to your apiary with Owner, Editor, or Viewer roles
- **AI-Assisted Inspections**: Transcribe voice recordings to inspection drafts (optional)
- **Multilingual**: English, German, French, Danish, Dutch, Italian, Slovak, and Serbian — language auto-detected from browser settings
- **Progressive Web App**: Installable on mobile and desktop, works offline
- **Mobile-First Design**: Optimised for field use with easy data entry

## Self-Hosted Setup

### Prerequisites

- Docker and Docker Compose
- A domain name (if using HTTPS / Traefik)

### Quick Start (HTTP only)

Create a `.env` file and a `docker-compose.yaml`:

**.env**
```env
DOMAIN=yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
# Must be a bcrypt hash — see "Setting the Admin Password" below
ADMIN_PASSWORD=$2a$12$5m1UQcYmWiDRHrXrFFxoqeX4BTGOKQDINfhXX5j9CkUwdJ8F62hIq
POSTGRES_PASSWORD=change-me-strong-db-password
DATABASE_URL=postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/beekeeper
FRONTEND_URL=http://yourdomain.com
JWT_SECRET=change-me-long-random-string
```

**docker-compose.yaml**
```yaml
services:
  app:
    image: ghcr.io/martinhrvn/hive-pal:latest
    ports:
      - '80:3000'
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      FRONTEND_URL: ${FRONTEND_URL}
      JWT_SECRET: ${JWT_SECRET}
      STORAGE_TYPE: local
    volumes:
      - uploads:/data/uploads
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: beekeeper
    volumes:
      - /data/hive-pal-data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d beekeeper']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  uploads:
```

Then run:

```bash
docker compose up -d
```

The application will be available at `http://yourdomain.com`.

---

### Setting the Admin Password

The `ADMIN_PASSWORD` environment variable **must be a bcrypt hash**. The application uses `bcrypt.compare()` to verify it, so a plain-text password will not work.

**Option 1 — Online generator (quickest)**

Go to [https://bcrypt-generator.com](https://bcrypt-generator.com), enter your password, set rounds to **12**, and click *Generate*. Copy the resulting hash directly into your `.env` file.

**Option 2 — Node.js (no extra dependencies required)**

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password-here', 12).then(h => console.log(h));"
```

**Option 3 — Python**

```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'your-password-here', bcrypt.gensalt(12)).decode())"
```

The resulting string (e.g. `$2a$12$...`) is what you set as `ADMIN_PASSWORD` in your `.env` file.

> The example hash in this README is for the password `password` and is **for demonstration only**. Always set a strong, unique password in production.

---

### HTTPS with Traefik

Traefik acts as a reverse proxy, handles TLS termination, and automatically obtains and renews certificates from Let's Encrypt. This is the recommended approach for any internet-facing deployment.

#### Step 1 — Point your domain to the server

In your DNS provider's control panel, create an **A record** pointing your chosen hostname to the public IP of your server:

```
Type  Name               Value
A     hivepal            203.0.113.10      ← your server's public IP
```

If you want the app at the root domain (`yourdomain.com`) rather than a subdomain, point the root A record instead. Either way, the `DOMAIN` variable in your `.env` must match exactly what you put in DNS.

DNS changes can take a few minutes to an hour to propagate. You can verify with:

```bash
dig +short hivepal.yourdomain.com
# should return your server's IP
```

Let's Encrypt's HTTP challenge requires that `http://yourdomain.com/.well-known/acme-challenge/...` is reachable from the internet, so **DNS must resolve correctly before you start the stack**.

#### Step 2 — Open firewall ports

Ports **80** and **443** must be reachable from the internet on your server. The exact command depends on your host:

```bash
# UFW (Ubuntu/Debian)
ufw allow 80/tcp
ufw allow 443/tcp

# firewalld (RHEL/CentOS/Fedora)
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

If your server is behind a cloud provider's security group (AWS, Hetzner, DigitalOcean, etc.), also open ports 80 and 443 in that console. Port 80 must remain open even after the certificate is issued — Traefik uses it for automated renewals.

#### Step 3 — Prepare the data directories

Traefik stores the Let's Encrypt account and certificates in `acme.json`. This file must exist before the container starts and must have permissions `600`, otherwise Traefik will refuse to write to it.

```bash
mkdir -p /data/hive-pal-data/letsencrypt
mkdir -p /data/hive-pal-data/postgres
mkdir -p /data/hive-pal-data/uploads

touch /data/hive-pal-data/letsencrypt/acme.json
chmod 600 /data/hive-pal-data/letsencrypt/acme.json
```

#### Step 4 — Create your .env file

```env
# Your public hostname — must match your DNS A record exactly
DOMAIN=hivepal.yourdomain.com

# Email address Let's Encrypt will use for expiry notifications
ACME_EMAIL=admin@yourdomain.com

# Hive Pal admin account
ADMIN_EMAIL=admin@yourdomain.com
# Must be a bcrypt hash — see "Setting the Admin Password" above
ADMIN_PASSWORD=$2a$12$5m1UQcYmWiDRHrXrFFxoqeX4BTGOKQDINfhXX5j9CkUwdJ8F62hIq

# Database — change the password to something strong
POSTGRES_PASSWORD=change-me-strong-db-password
DATABASE_URL=postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/beekeeper

# JWT signing secret — generate with: openssl rand -hex 32
JWT_SECRET=change-me-long-random-string
```

#### Step 5 — Create docker-compose.traefik.yaml

```yaml
services:
  traefik:
    image: traefik:v3.0
    container_name: hive-pal-traefik
    command:
      - '--providers.docker=true'
      - '--providers.docker.exposedbydefault=false'
      - '--entrypoints.web.address=:80'
      - '--entrypoints.websecure.address=:443'
      # Let's Encrypt HTTP-01 challenge
      - '--certificatesresolvers.letsencrypt.acme.httpchallenge=true'
      - '--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web'
      - '--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}'
      - '--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json'
      # Redirect all HTTP traffic to HTTPS
      - '--entrypoints.web.http.redirections.entrypoint.to=websecure'
      - '--entrypoints.web.http.redirections.entrypoint.scheme=https'
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - '/var/run/docker.sock:/var/run/docker.sock:ro'
      - '/data/hive-pal-data/letsencrypt:/letsencrypt'
    restart: unless-stopped

  app:
    image: ghcr.io/martinhrvn/hive-pal:latest
    container_name: hive-pal-app
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      FRONTEND_URL: https://${DOMAIN}
      JWT_SECRET: ${JWT_SECRET}
      STORAGE_TYPE: local
    volumes:
      - /data/hive-pal-data/uploads:/data/uploads
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '-q', '--spider', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.app.rule=Host(`${DOMAIN}`)'
      - 'traefik.http.routers.app.entrypoints=websecure'
      - 'traefik.http.routers.app.tls.certresolver=letsencrypt'
      - 'traefik.http.services.app.loadbalancer.server.port=3000'
    restart: unless-stopped

  postgres:
    image: postgres:14
    container_name: hive-pal-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: beekeeper
    volumes:
      - '/data/hive-pal-data/postgres:/var/lib/postgresql/data'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d beekeeper']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
```

#### Step 6 — Start the stack

```bash
docker compose -f docker-compose.traefik.yaml up -d
```

Watch the Traefik logs to confirm the certificate is issued (usually takes under 30 seconds):

```bash
docker logs hive-pal-traefik -f
# Look for: "Obtained certificates" or "acme: Obtained SAN certificate"
```

The application will be available at `https://hivepal.yourdomain.com`.

#### Testing with Let's Encrypt staging

Let's Encrypt enforces [rate limits](https://letsencrypt.org/docs/rate-limits/) (5 duplicate certificates per week per domain). Before pointing a real domain, it is worth running one test against the staging environment to verify your setup without consuming your quota.

Add this extra flag to the Traefik `command` list:

```yaml
- '--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory'
```

Staging certificates are issued by a fake CA and will show a browser warning, but the ACME flow is identical. Once you have confirmed the challenge succeeds, remove that flag and delete `acme.json` so Traefik requests a real certificate:

```bash
docker compose -f docker-compose.traefik.yaml down
rm /data/hive-pal-data/letsencrypt/acme.json
touch /data/hive-pal-data/letsencrypt/acme.json
chmod 600 /data/hive-pal-data/letsencrypt/acme.json
docker compose -f docker-compose.traefik.yaml up -d
```

#### Optional: Traefik dashboard

The Traefik dashboard gives a live view of routers, services, and certificate status. To enable it, add `--api.dashboard=true` to the Traefik `command` list and a router label to the Traefik service itself:

```yaml
  traefik:
    ...
    command:
      - '--api.dashboard=true'
      # ... existing flags ...
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)'
      - 'traefik.http.routers.dashboard.service=api@internal'
      - 'traefik.http.routers.dashboard.entrypoints=websecure'
      - 'traefik.http.routers.dashboard.tls.certresolver=letsencrypt'
```

The dashboard will then be available at `https://traefik.yourdomain.com`. It has no authentication by default — restrict access with an IP allowlist or basic auth middleware if your server is publicly reachable.

#### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Certificate never issued, logs show `connection refused` | Port 80 is blocked | Open port 80 in firewall / security group |
| `acme: error: 403 :: urn:ietf:params:acme:error:unauthorized` | DNS not yet pointing to this server | Wait for propagation, verify with `dig` |
| Traefik exits immediately | `acme.json` has wrong permissions | `chmod 600 /data/hive-pal-data/letsencrypt/acme.json` |
| Browser shows certificate warning on first load | Using staging CA, or certificate still pending | Check Traefik logs; remove staging flag for production |
| App returns 502 Bad Gateway | App container not healthy yet | `docker logs hive-pal-app` — wait for health check to pass |
| `too many certificates already issued` | Let's Encrypt rate limit hit | Use staging CA to test; wait up to a week |

---

### Email / SMTP Configuration

Email is optional but required for password reset functionality. Two providers are supported — the application will auto-detect which one to use based on the environment variables present.

**Option 1 — SMTP**

Add the following to your `.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password
SMTP_SECURE=false              # true for port 465 (SSL), false for 587 (STARTTLS)
SMTP_REJECT_UNAUTHORIZED=true  # set to false only if using self-signed certs
FROM_EMAIL=noreply@example.com
```

For Gmail, generate an [App Password](https://support.google.com/accounts/answer/185833) and use that as `SMTP_PASS` with `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`.

**Option 2 — Resend**

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
```

If both are configured, Resend takes priority. To force a specific provider set `MAIL_PROVIDER=smtp` or `MAIL_PROVIDER=resend`. Set `MAIL_PROVIDER=none` to explicitly disable email.

---

### AI Module (Voice-to-Inspection)

Hive Pal includes an optional AI module that transcribes voice recordings into inspection drafts. It uses [Faster-Whisper](https://github.com/SYSTRAN/faster-whisper) for speech-to-text and [Ollama](https://ollama.com) to parse the transcript into a structured inspection.

**Step 1 — Prepare the data directory**

The AI service expects the following folder structure on the host:

```
/data/hivepal/ai/
  incoming/     # Drop audio files here
  processed/    # Processed audio files are moved here
  transcripts/  # Raw transcripts are saved here
  ollama/       # Ollama model storage
```

Create the directories and ensure the container user (ID 999) has read/write access:

```bash
mkdir -p /data/hivepal/ai/{incoming,processed,transcripts,ollama}
chmod -R 777 /data/hivepal/ai
```

**Step 2 — Add the AI services to your compose file**

```yaml
  hivepal-ai:
    image: ghcr.io/martinhrvn/hivepal-ai:latest
    container_name: hivepal-ai
    depends_on:
      - ollama
    environment:
      OLLAMA_URL: http://ollama:11434/api/chat
      OLLAMA_MODEL: qwen2.5:3b
      WHISPER_MODEL: small
      WHISPER_COMPUTE_TYPE: int8
      AUDIO_INPUT_DIR: /data/incoming
      TRANSCRIPTS_DIR: /data/transcripts
      OUTPUT_DIR: /data/processed
      AI_API_KEY: change-me-long-random-string
    ports:
      - '8008:8008'
    volumes:
      - /data/hivepal/ai:/data
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    container_name: hivepal-ollama
    ports:
      - '11434:11434'
    volumes:
      - /data/hivepal/ai/ollama:/root/.ollama
    restart: unless-stopped
```

**Step 3 — Enable AI in the main app**

Add these variables to the `app` service environment:

```env
AI_ENABLED=true
AI_SERVICE_URL=http://hivepal-ai:8008
AI_SERVICE_API_KEY=change-me-long-random-string   # must match AI_API_KEY above
AI_REQUEST_TIMEOUT_MS=300000
STORAGE_TYPE=local
```

**Step 4 — Pull the Ollama model**

After the stack starts, pull the language model (approximately 2 GB):

```bash
docker exec hivepal-ollama ollama pull qwen2.5:3b
```

Alternatively, trigger the pull via the API:

```bash
curl -X POST http://your-server:11434/api/pull \
  -d '{"model": "qwen2.5:3b", "stream": false}'
```

You can use a different model by changing `OLLAMA_MODEL`. Larger models produce better results but require more RAM. The `qwen2.5:3b` model works well on CPU-only servers.

**Verify the AI service is running:**

```bash
curl http://your-server:8008/health
```

---

## Inspection Types

Each apiary can be configured to use one of two inspection workflows. The setting is per-apiary and can be changed at any time from the apiary settings screen.

### Subjective (default)

Inspections use qualitative 0–10 ratings for each observed attribute (brood quality, temper, stores, etc.). There are no frame counts or auto-scoring. This mode suits beekeepers who prefer a quicker, impression-based record without counting individual frames.

### Data Driven

Inspections record concrete counts and measurements: frames of brood, frames of bees, honey stores, etc. The application uses these values to calculate a hive health score automatically. This mode is best for beekeepers who want structured, comparable data across inspections and hives.

### Switching Inspection Type

1. Navigate to **Apiaries** and select the apiary you want to configure.
2. Open **Edit Apiary** (pencil icon).
3. Under **Inspection Type**, choose *Data Driven* or *Subjective*.
4. Save. All new inspections for hives in that apiary will use the selected workflow.

Existing inspection records are not affected when you switch — they remain stored with their original values.

---

## Environment Variables Reference

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_EMAIL` | Email address for the built-in admin account |
| `ADMIN_PASSWORD` | **bcrypt hash** of the admin password |
| `FRONTEND_URL` | Public URL of the application (used in emails and CORS) |
| `JWT_SECRET` | Secret key used to sign JWT tokens |

### Optional — Email

| Variable | Description |
|----------|-------------|
| `MAIL_PROVIDER` | Force a specific provider: `resend`, `smtp`, or `none` (auto-selects if unset) |
| `RESEND_API_KEY` | API key for Resend (takes priority over SMTP) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_SECURE` | `true` for port 465 (SSL), `false` for port 587 (STARTTLS) |
| `SMTP_REJECT_UNAUTHORIZED` | Reject invalid TLS certificates (default `true`; set `false` for self-signed) |
| `FROM_EMAIL` | Sender address for outgoing emails |

### Optional — Storage

| Variable | Description |
|----------|-------------|
| `STORAGE_TYPE` | `local` for filesystem storage, `s3` for S3-compatible (default: `s3`) |
| `STORAGE_LOCAL_PATH` | Directory for local file storage (default: `/data/uploads`) |
| `S3_ENDPOINT` | S3-compatible endpoint URL |
| `S3_REGION` | S3 region (default: `us-east-1`) |
| `S3_BUCKET` | S3 bucket name |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |

### Optional — AI Module

| Variable | Description |
|----------|-------------|
| `AI_ENABLED` | Set to `true` to enable AI voice processing |
| `AI_SERVICE_URL` | Base URL of the AI service (e.g. `http://hivepal-ai:8008`) |
| `AI_SERVICE_API_KEY` | Shared secret between the app and the AI service |
| `AI_REQUEST_TIMEOUT_MS` | Timeout for AI requests in milliseconds (default: `300000`) |

### Optional — Networking

| Variable | Description |
|----------|-------------|
| `ALLOWED_ORIGINS` | Comma-separated list of origins allowed for CORS (e.g. `https://yourdomain.com`) |
| `PORT` | Port the backend listens on (default: `3000`) |

### Optional — Logging

| Variable | Description |
|----------|-------------|
| `LOG_LEVEL` | Winston log level: `error`, `warn`, `info`, `debug` (default: `info`) |
| `LOKI_HOST` | URL of a Loki instance for centralised log shipping (e.g. `http://loki:3100`) |

### Optional — Storage (additional)

| Variable | Description |
|----------|-------------|
| `AUDIO_MAX_FILE_SIZE` | Maximum size for audio file uploads in bytes (default: `52428800` — 50 MB) |

### Optional — Monitoring / Error Tracking

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Backend Sentry DSN |
| `SENTRY_ENVIRONMENT` | Backend Sentry environment tag |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN |
| `VITE_SENTRY_ENVIRONMENT` | Frontend Sentry environment tag |

---

## Translations

The UI is fully internationalised using [i18next](https://www.i18next.com/). Translation strings live in `apps/frontend/public/locales/` as plain JSON files, one folder per language code:

```
apps/frontend/public/locales/
  en/   ← source language (English)
  de/
  fr/
  da/
  nl/
  it/
  sk/
  sr/
```

Each language folder contains eight namespace files: `admin.json`, `apiary.json`, `auth.json`, `common.json`, `hive.json`, `inspection.json`, `onboarding.json`, and `queen.json`. The language is detected automatically from the browser and can be changed from the user menu.

### Adding or improving a translation manually

1. Copy the `en/` folder and rename it to the [BCP 47 language code](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry) for your language (e.g. `pt` for Portuguese).
2. Translate the values in each JSON file. Keys must not be changed — only the values.
3. Open a pull request.

### Contributing via Weblate

The project has a hosted Weblate instance at **[weblate.hivepal.app](https://weblate.hivepal.app/projects/hive-pal/)**. This is the easiest way to contribute a translation — no Git knowledge required.

1. Create a free account at [weblate.hivepal.app](https://weblate.hivepal.app/projects/hive-pal/).
2. Browse to the component you want to translate (e.g. *Common*, *Inspection*, *Hive*).
3. Select your language and start translating. Weblate will open a pull request back to the repository automatically.

To add a language that doesn't exist yet, use the *Start new translation* button on the component page and select your language from the list.

---

## Development

### Prerequisites

- Node.js 22+
- PNPM package manager
- Docker (for the database)

```bash
# Clone the repository
git clone https://github.com/martinhrvn/hive-pal.git
cd hive-pal

# Install dependencies
pnpm install

# Copy and edit the backend env file
cp apps/backend/.env.example apps/backend/.env

# Start the development stack (frontend + backend + database)
pnpm dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:3000/api`.
Swagger UI is available at `http://localhost:3000/api-docs`.

### Useful Commands

```bash
# Build all packages
turbo build

# Run backend E2E tests (requires Docker for Testcontainers)
cd apps/backend && pnpm test:e2e

# Run frontend component tests
cd apps/frontend && pnpm test:ct

# Lint and format
turbo lint
turbo format
```

---

## Project Structure

```
apps/
  frontend/    React application
  backend/     NestJS API server
  ai-app/      Optional AI voice transcription service
  e2e/         Playwright end-to-end tests
packages/
  shared-schemas/   Zod validation schemas (used by both frontend and backend)
  page-objects/     Page objects for E2E testing
```

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand + React Query (TanStack Query)
- **Routing**: React Router
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL 14
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Winston with Loki integration
- **Monitoring**: Prometheus metrics, health checks

### DevOps & Tooling
- **Package Management**: PNPM with workspaces
- **Build System**: Turborepo
- **Containerisation**: Docker with multi-stage builds
- **Testing**: Jest, Playwright, Testcontainers
- **CI/CD**: GitHub Actions

## License

This project is licensed under the MIT License — see the LICENSE file for details.

## Acknowledgments

- Inspired by beekeepers who needed a better way to track their hives
