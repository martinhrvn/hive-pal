# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hive Pal is a full-stack beekeeping management application built as a monorepo using PNPM workspaces and Turbo.

## Essential Commands

### Development
```bash
# Start all services (frontend, backend, database)
pnpm dev

# Start individual services
cd apps/frontend && pnpm dev  # Frontend on http://localhost:5173
cd apps/backend && pnpm dev    # Backend on http://localhost:3000/api

# Database operations (from apps/backend)
pnpm db:up                     # Start PostgreSQL in Docker
pnpm prisma:generate          # Generate Prisma client
prisma migrate dev       # Run migrations
pnpm seed                     # Seed database with test data
```

### Building & Testing
```bash
# Build all packages
turbo build

# Linting and formatting
turbo lint                     # Lint all packages
turbo format                   # Format all code
turbo format:check            # Check formatting

# Testing (from apps/backend)
pnpm test:e2e                # Run backend E2E tests with test containers
pnpm test:watch              # Watch mode for tests

# Frontend testing (from apps/frontend)
pnpm typecheck               # Type checking
pnpm test:ct                 # Component tests with Playwright
```

## Architecture

### Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui components, React Query, React Router, Zustand
- **Backend**: NestJS, Prisma ORM, PostgreSQL, JWT authentication, Winston logging
- **Shared**: Zod schemas for validation across frontend/backend
- **Infrastructure**: Docker, Prometheus, Grafana, Loki for monitoring

### Project Structure
```
apps/
  frontend/          # React application
  backend/           # NestJS API
  e2e/              # Playwright E2E tests
packages/
  shared-schemas/    # Zod schemas shared between frontend/backend
  page-objects/      # Page objects for E2E testing
```

### Key Architectural Patterns

**Authentication & Authorization**
- JWT-based authentication with refresh tokens
- Apiary-level data isolation - users can only access their own apiaries' data
- Auth guards in backend: `@UseGuards(JwtAuthGuard)`
- Frontend auth state managed in `apps/frontend/src/stores/authStore.ts`

**Data Flow**
1. Frontend makes API calls using Axios with interceptors (`apps/frontend/src/lib/api.ts`)
2. React Query manages server state and caching
3. Backend validates requests using Zod schemas
4. Prisma handles database operations with type safety
5. Responses are validated with shared schemas

**Database Schema Key Relationships**
- Users → Apiaries (one-to-many)
- Apiaries → Hives (one-to-many)
- Hives → Inspections, Queens, Equipment (one-to-many)
- Complex domain model for beekeeping management

**Backend Module Structure**
Each feature module in `apps/backend/src/` follows this pattern:
- `*.module.ts` - Module definition
- `*.controller.ts` - HTTP endpoints
- `*.service.ts` - Business logic
- `*.repository.ts` - Database operations
- `dto/*.dto.ts` - Data transfer objects

**Frontend Component Structure**
- Components use shadcn/ui primitives from `apps/frontend/src/components/ui/`
- Pages follow routing structure in `apps/frontend/src/routes/`
- Forms use React Hook Form with Zod validation
- API integration through custom hooks using React Query

### Environment Configuration

**Frontend** (`apps/frontend/.env`):
```
VITE_API_URL=http://localhost:3000
VITE_SENTRY_DSN=           # Optional error tracking
```

**Backend** (`apps/backend/.env`):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beekeeper?schema=public"
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:5173
SENTRY_DSN=                # Optional error tracking
```

### API Documentation
- Swagger UI available at `http://localhost:3000/api-docs` when backend is running
- API uses RESTful conventions with `/api` prefix
- All endpoints require JWT authentication except `/api/auth/*`

### Testing Strategy
- **Unit Tests**: Jest for backend services
- **Integration Tests**: Testcontainers for database operations
- **E2E Tests**: Playwright for full user workflows
- **Component Tests**: Playwright component testing for React components

### Error Handling
- Global exception filter in backend (`apps/backend/src/global-exception.filter.ts`)
- React Error Boundary for frontend (`apps/frontend/src/components/ErrorBoundary.tsx`)
- Sentry integration for production error tracking (when configured)

### Monitoring & Logging
- Winston logger with Loki integration for centralized logging
- Prometheus metrics exposed at `/metrics`
- Health checks at `/health`
- Custom logging interceptor tracks all API requests

### Important Conventions
- All database queries must respect apiary ownership (check `apiaryId` in queries)
- Use Zod schemas from `shared-schemas` for validation
- Follow NestJS dependency injection patterns
- Use React Query for all server state management
- Components should use Tailwind CSS classes, avoid inline styles
- API responses follow consistent structure with proper HTTP status codes