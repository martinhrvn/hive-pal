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
- Node.js 18+ (for development only)
- PNPM package manager

### Running with Docker Compose (Production)

The application includes a production-ready Docker Compose configuration that sets up all required services.

```bash
# Clone the repository (or download docker-compose.prod.yaml)
git clone https://github.com/martinhrvn/hive-pal.git
cd hive-pal

# Create a .env file with your configuration (see Environment Variables below)
cp .env.example .env

# Start all services (backend, frontend, database)
docker-compose -f docker-compose.prod.yaml up -d

# View logs
docker-compose -f docker-compose.prod.yaml logs -f

# Stop all services
docker-compose -f docker-compose.prod.yaml down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose -f docker-compose.prod.yaml down -v
```

The application will be available at:
- Frontend: Port needs to be exposed via docker-compose override or reverse proxy
- Backend API: Port 3000 (internal to Docker network)
- API Documentation: http://localhost:3000/api-docs (if port 3000 is exposed)

### Port Configuration

The default `docker-compose.prod.yaml` doesn't expose ports directly for security. To access the services:

**Option 1: Add port mappings** (create `docker-compose.override.yaml`):
```yaml
services:
  frontend:
    ports:
      - "80:9000"     # Expose frontend on port 80
  backend:
    ports:
      - "3000:3000"   # Expose backend API on port 3000
```

**Option 2: Use a reverse proxy** (recommended for production) - Configure nginx/Caddy to proxy requests to the Docker services.

### Environment Variables

Create a `.env` file in the project root with the following variables:

#### Required Variables

```bash
# Backend Configuration
DATABASE_URL=postgres://postgres:postgres@postgres:5432/beekeeper
ADMIN_EMAIL=admin@example.com           # Initial admin account email
ADMIN_PASSWORD=changeme123              # Initial admin account password (change this!)
API_URL=http://backend:3000             # Internal API URL for frontend
FRONTEND_URL=https://yourdomain.com     # Public frontend URL (for emails)

# Frontend Configuration
VITE_API_URL=https://api.yourdomain.com # Public API URL for browser
```

#### Optional Variables

```bash
# Email Configuration (Optional - required for password reset functionality)
SMTP_HOST=smtp.gmail.com                # SMTP server hostname
SMTP_PORT=587                           # SMTP server port
SMTP_USER=your-email@gmail.com          # SMTP username
SMTP_PASS=your-app-password             # SMTP password
SMTP_SECURE=false                       # Use TLS (true for port 465, false for 587)
SMTP_REJECT_UNAUTHORIZED=false          # Reject self-signed certificates
FROM_EMAIL=noreply@yourdomain.com       # Sender email address

# Monitoring (Optional - for error tracking)
SENTRY_DSN=https://your-sentry-dsn      # Backend Sentry DSN
SENTRY_ENVIRONMENT=production            # Environment name
VITE_SENTRY_DSN=https://frontend-dsn    # Frontend Sentry DSN
VITE_SENTRY_ENVIRONMENT=production      # Frontend environment
```

### Docker Compose Services

The `docker-compose.prod.yaml` file sets up three services:

1. **PostgreSQL Database**
   - Image: `postgres:14`
   - Persistent data storage at `/data/hive-pal-data/postgres`
   - Health checks ensure database readiness

2. **Backend (NestJS)**
   - Image: `ghcr.io/martinhrvn/hive-pal-backend:latest`
   - Depends on PostgreSQL
   - Health endpoint: `/api/health`
   - Handles API requests and business logic
   - **Automatic migrations**: Database migrations run automatically on startup

3. **Frontend (React)**
   - Image: `ghcr.io/martinhrvn/hive-pal-frontend:latest`
   - Depends on Backend
   - Serves the web interface
   - Connects to backend via configured API URL

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
