# Hive Pal 🐝

[![Tests](https://github.com/martinhrvn/hive-pal/actions/workflows/check.yml/badge.svg)](https://github.com/martinhrvn/hive-pal/actions/workflows/check.yml)

A modern beekeeping management application designed for both mobile and desktop use. Track your apiaries, hives, inspections, and more with our intuitive interface.

## Features

- **AI Voice Inspections**: Record audio at the hive and let AI transcribe it and draft structured inspection notes — powered by open models (faster-whisper + Ollama) that you can self-host
- **Apiary Management**: Create and track multiple apiaries with location and weather information
- **Hive Tracking**: Monitor hives, their status, boxes, and frame configuration
- **Inspection Workflows**: Record detailed inspections with observations, photos, treatments, and actions
- **Batch Inspections**: Step through an entire apiary in one guided session
- **Scheduling & Calendar**: Plan inspections and see tasks across all apiaries on a unified calendar
- **Queen Management**: Track queen lineage, marking, performance, and replacement history
- **Harvest Tracking**: Record honey harvests, processing, and yields per hive and season
- **Equipment Planning**: Plan and account for boxes, frames, and gear across your hives
- **Reports & Analytics**: Surface colony-health and productivity trends over time
- **QR Codes**: Print and scan hive labels to jump straight to the right record
- **Collaboration**: Share apiaries with other beekeepers via invite links
- **Free Tools**: Browser-based calculators and planners (syrup calculator, brood timeline, swarm management) — no signup required
- **Mobile-First & Offline-Ready**: Optimized for field use and installable as a PWA that keeps working without signal
- **Multilingual**: Available in multiple languages with community translations
- **Data Portability**: Import and export your data — your records stay yours
- **Open Source & Self-Hostable**: MIT-licensed and free to run on your own hardware
- **HiveScale Integration**: Claim and monitor self-hosted HiveScale devices, including weight, temperature, battery, solar, and cellular telemetry

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Running with Docker Compose

Create a `docker-compose.yaml` with the following content:

```yaml
services:
  app:
    image: ghcr.io/martinhrvn/hive-pal:latest
    ports:
      - '80:3000'
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/beekeeper
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: changeme123
      FRONTEND_URL: https://yourdomain.com
      STORAGE_TYPE: local # use 'local' for filesystem or 's3' for S3-compatible storage
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

Then run:

```bash
docker compose up -d
```

The application will be available at http://localhost.

### Environment Variables

#### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret used to sign Better Auth sessions/cookies (32+ chars; generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Backend public base URL where `/api/auth/*` is served |
| `ADMIN_EMAIL` | Initial admin account email |
| `ADMIN_PASSWORD` | Initial admin account password (plaintext; hashed on first run) |
| `FRONTEND_URL` | Public URL (used in emails) |

#### Optional

| Variable | Description |
|----------|-------------|
| `PASSKEY_RP_ID` | WebAuthn relying-party ID for passkeys (default: `localhost`) |
| `COOKIE_DOMAIN` | Set in production when frontend and backend share a parent domain |
| `MAIL_PROVIDER` | Force a specific provider: `resend`, `smtp`, or `none` (auto-selects if unset) |
| `RESEND_API_KEY` | API key for Resend email provider |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_SECURE` | Use TLS (`true` for port 465, `false` for 587) |
| `SMTP_REJECT_UNAUTHORIZED` | Reject invalid TLS certificates (default `true`; set `false` for self-signed) |
| `FROM_EMAIL` | Sender email address |
| `STORAGE_TYPE` | `s3` (default) or `local` for filesystem storage |
| `STORAGE_LOCAL_PATH` | Directory for local file storage (default: `/data/uploads`) |
| `S3_ENDPOINT` | S3-compatible endpoint URL |
| `S3_REGION` | S3 region (default: `us-east-1`) |
| `S3_BUCKET` | S3 bucket name |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |
| `SENTRY_DSN` | Backend Sentry DSN |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN |
| `VITE_SENTRY_ENVIRONMENT` | Frontend Sentry environment |
| `HIVESCALE_API_BASE_URL` | Base URL of the HiveScale backend for scale integration |
| `HIVESCALE_SERVICE_API_KEY` | Shared service key used by HivePal to call HiveScale |

## Development

```bash
# Clone the repository
git clone https://github.com/martinhrvn/hive-pal.git

# Install dependencies
cd hive-pal
pnpm install

# Start the development server
pnpm dev
```

### Prerequisites for Development

- Node.js 22+
- PNPM package manager

## Project Structure

```
/apps
  /frontend - React frontend application
  /backend - NestJS API server
  /hivescale - HiveScale integration notes and compose overlay
  /e2e - End-to-end tests with Playwright
/packages
  /shared-schemas - Shared Zod validation schemas
  /page-objects - Page objects for E2E testing
```

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand + React Query (TanStack Query)
- **Routing**: React Router
- **Build Tool**: Vite
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL 14
- **ORM**: Prisma
- **Authentication**: Better Auth (session cookies, passkey/WebAuthn support)
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Winston with Loki integration
- **Monitoring**: Prometheus metrics, health checks

### DevOps & Tooling
- **Package Management**: PNPM with workspaces
- **Build System**: Turborepo for monorepo management
- **Containerization**: Docker with multi-stage builds
- **Testing**: Jest, Playwright, Testcontainers
- **CI/CD**: GitHub Actions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by beekeepers who needed a better way to track their hives
