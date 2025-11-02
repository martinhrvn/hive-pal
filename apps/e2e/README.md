# E2E Tests

End-to-end tests for Hive Pal using Playwright.

## Prerequisites

- Install dependencies: `pnpm install`
- Build packages: `pnpm turbo build` (required for page-objects package)
- Install Playwright browsers: `pnpm --filter e2e exec playwright install --with-deps`

## Running Tests

### Against Local Development Server

```bash
# Make sure local frontend and backend are running first
cd apps/e2e
pnpm test:local          # Run tests
pnpm test:ui             # Run tests with UI mode
```

Configuration: `.env.local`

### Against Preview Environment

```bash
# First, set up your preview environment credentials
cp .env.preview.example .env.preview
# Edit .env.preview with actual credentials

cd apps/e2e
pnpm test:preview        # Run tests
pnpm test:preview:ui     # Run tests with UI mode
```

Configuration: `.env.preview`

### CI/CD

Tests are triggered via webhook after successful Coolify deployments to the preview environment.

See [Coolify Webhook Setup](../../.github/COOLIFY_WEBHOOK_SETUP.md) for configuration details.

## Environment Variables

- `BASE_URL`: The base URL of the application to test
- `ADMIN_EMAIL`: Admin user email for authentication tests
- `ADMIN_PASSWORD`: Admin user password for authentication tests

## File Structure

- `tests/` - Test files
  - `auth.setup.ts` - Authentication setup (runs before tests)
  - `auth/` - Authentication tests
- `playwright.config.ts` - Playwright configuration
