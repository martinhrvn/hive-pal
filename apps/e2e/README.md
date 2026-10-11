# E2E Tests

End-to-end tests for Hive Pal using Playwright.

Two suites live here:

- **Smoke suite** (`tests/smoke/`, config `playwright.smoke.config.ts`): one
  happy path per page, every spec signs up its own user, runs against a
  deployed preview or a local stack. This is what CI runs. See
  [`tests/smoke/README.md`](tests/smoke/README.md) and
  [`tests/smoke/TODO.md`](tests/smoke/TODO.md).
- **Legacy suite** (`tests/*.spec.ts`, `tests/**/`, config
  `playwright.config.ts`): older multi-browser tests that depend on a shared
  admin login. Several are out of date; they are not run in CI.

## Prerequisites

- Install dependencies: `pnpm install`
- Build the page objects: `pnpm --filter page-objects build`
- Browsers: run inside `devenv shell` (Nix-provided browsers matching the
  repo's Playwright version), or `pnpm --filter e2e exec playwright install --with-deps chromium`.

## Running

```bash
cd apps/e2e

# Smoke suite
BASE_URL=https://243.preview.hivepal.app pnpm test:smoke
pnpm test:smoke:local            # against pnpm dev, reads .env.local
pnpm test:smoke:ui               # Playwright UI mode

# Legacy suite
pnpm test:local                  # .env.local
pnpm test:preview                # .env.preview
```

## CI

`.github/workflows/e2e-smoke.yml` runs the smoke suite on demand:

```bash
gh workflow run e2e-smoke.yml -f base_url=https://<PR>.preview.hivepal.app
```

It waits for `/api/health`, runs `@journey|@core` by default, uploads the
HTML report and posts one comment on the PR (or on the commit for the main
preview).

## Environment variables

- `BASE_URL`: origin of the application under test
- `SMOKE_WORKERS`, `SMOKE_GREP`: smoke suite parallelism and tag filter
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: admin credentials (legacy suite and `@admin` smoke specs)
