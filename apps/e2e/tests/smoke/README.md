# Smoke suite

One happy path per page, run against a deployed preview or a local stack.
Config: `apps/e2e/playwright.smoke.config.ts`. Tracker: [`TODO.md`](./TODO.md).

## Running

Inside `devenv shell` (it provides the Playwright browsers for this repo's
Playwright version):

```bash
# against a preview
BASE_URL=https://243.preview.hivepal.app pnpm --filter e2e test:smoke
BASE_URL=... SMOKE_GREP='@journey|@core' pnpm --filter e2e test:smoke
BASE_URL=... pnpm --filter e2e test:smoke -- tests/smoke/core/hives.spec.ts

# against a local stack (pnpm dev: frontend 5173, backend 3000)
pnpm --filter e2e test:smoke:local                     # reads apps/e2e/.env.local
pnpm --filter e2e test:smoke:ui

pnpm --filter e2e exec playwright show-report          # HTML report of the last run
```

| Variable                        | Purpose                                                  | Default                 |
| ------------------------------- | -------------------------------------------------------- | ----------------------- |
| `BASE_URL`                      | Origin under test (frontend and `/api` on the same host) | `http://localhost:5173` |
| `SMOKE_WORKERS`                 | Parallel workers                                         | `2`                     |
| `SMOKE_GREP`                    | Regex on titles and tags (`@journey`, `@core`, …)        | all                     |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Only for `@admin` specs (skipped when unset)             | –                       |

In CI the suite runs from `.github/workflows/e2e-smoke.yml` via
`workflow_dispatch` (`gh workflow run e2e-smoke.yml -f base_url=https://<PR>.preview.hivepal.app`).

Troubleshooting: if Chromium dies on launch inside devenv with a
`GLIBC_x.y not found` error, your host shell is leaking an `LD_LIBRARY_PATH`
into the devenv shell. Run with `env -u LD_LIBRARY_PATH …`.

## How specs are built

- **One user per spec file.** Use the `freshUser` fixture from `./fixtures`:
  it signs up via `POST /api/auth/sign-up/email`, injects the session cookie
  into the browser context and exposes `api` for seeding (`createHive`,
  `createInspection`, `createQueen`, `createTodo`, `createApiary`, …) plus
  `apiaryId` of the auto-created "My Apiary". Never share `storageState`
  files between specs.
- **Seed through the API, assert through the UI.** Only the thing a spec is
  about goes through the UI; prerequisites come from `api.*`.
- **Tags**: `test.describe('Hives', { tag: ['@core'] }, …)`. Tiers:
  `@journey`, `@core`, `@extended`, `@collab`, `@admin`.
- **Selectors**: `getByRole` / `getByLabel` / `getByText` first. Add a
  `data-testid` in the frontend only when no stable accessible name exists
  (e.g. the label changes with state), and note it in `TODO.md`.
- **Page objects** live in `packages/page-objects/src/<feature>/` (one folder
  per feature so parallel work does not collide). `apps/e2e/tsconfig.json`
  maps `page-objects` to the package source, so no rebuild is needed while
  iterating (CI still runs `pnpm --filter page-objects build` for the
  component tests). The only shared file is
  `packages/page-objects/src/index.ts` (append one `export * from` line).
- **No `waitForTimeout`** outside the apiary-switcher retry helper. Wait for
  URLs, headings or network responses.
- **Feature flags**: `storageEnabled` / `aiEnabled` from `api.features()`.
  Skip or avoid gated sections; never assert on share buttons
  (`VITE_CLOUD_MODE`).
- Keep each spec to about five UI steps; one assertion per step that matters.
- Third-party requests (analytics, map tiles) and `/api/weather`,
  `/api/hivescale` are aborted by the auto fixture `blockThirdParty`.

## Working on a TODO item (for agents and humans)

1. Claim an unchecked line in `TODO.md` (add `owner: <name>`), commit the claim.
2. Write page objects in a new feature folder and the spec under the tier
   directory named in `TODO.md`.
3. Verify on your own: `BASE_URL=... pnpm --filter e2e test:smoke -- tests/smoke/<tier>/<file>`.
   Running several specs or several agents against the same deployment at
   once is fine: every spec owns its data through its own user.
4. Tick the line and record anything surprising (gated features,
   hard-coded labels, flaky controls) under it.

Known shared state on a deployment: the per-IP sign-up rate limit
(3 sign-ups / 10 s in production mode; `freshUser` retries on 429), the admin
account (read-only use) and the global feedback table (append-only).
