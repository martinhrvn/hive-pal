# Hive Pal 🐝

[![Tests](https://github.com/martinhrvn/hive-pal/actions/workflows/check.yml/badge.svg)](https://github.com/martinhrvn/hive-pal/actions/workflows/check.yml)

A modern beekeeping management application designed for both mobile and desktop use. Track your apiaries, hives, inspections, and more with our intuitive interface.

**⚠️ IMPORTANT: This project is very much a Work In Progress. The API is mostly stable but there may be breaking changes.**

## Features

- **Apiary Management**: Create and track multiple apiaries with location information
- **Hive Tracking**: Monitor hives, their status, and configuration
- **Inspection Workflows**: Record detailed inspections with observations and actions
- **Queen Management**: Track queen lineage and replacement history
- **Mobile-First Design**: Optimized for field use with easy data entry

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
| `ADMIN_EMAIL` | Initial admin account email |
| `ADMIN_PASSWORD` | Initial admin account password |
| `FRONTEND_URL` | Public URL (used in emails) |

#### Optional

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_SECURE` | Use TLS (`true` for port 465, `false` for 587) |
| `FROM_EMAIL` | Sender email address |
| `SENTRY_DSN` | Backend Sentry DSN |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN |
| `VITE_SENTRY_ENVIRONMENT` | Frontend Sentry environment |

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
- **Authentication**: JWT with refresh tokens
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
