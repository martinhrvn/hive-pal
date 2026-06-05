# Hive Pal frontend

React + TypeScript + Vite frontend for Hive Pal.

## Main stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS v4
- shadcn/ui components

## Development

```bash
pnpm install
pnpm dev
```

The frontend talks to the HivePal backend API. In local development, configure the backend URL through the existing frontend environment settings used by the app.

## HiveScale frontend integration

HiveScale UI lives under `apps/frontend/src/pages/hivescale/` and is reachable from the `/hivescale` route.

Important files:

| File | Purpose |
|---|---|
| `src/api/hooks/useHiveScale.ts` | TanStack Query hooks and TypeScript types for HiveScale proxy APIs |
| `src/pages/hivescale/hivescale-page.tsx` | Main device list, claim form, latest readings, config, calibration, sharing, and off-grid status UI |
| `src/pages/hivescale/hivescale-diagram-panel.tsx` | Historical charts for weight, temperature, battery, solar, and cellular telemetry |
| `src/routes/index.tsx` | Route registration for `/hivescale` |

The frontend never calls the HiveScale FastAPI service directly. All calls go through the HivePal backend under `/api/hivescale/...`, where the backend attaches `X-HivePal-Service-Key` and `X-User-Id`.

### Displayed HiveScale telemetry

Core telemetry:

- Scale 1 and scale 2 weight
- Hive 1 and hive 2 temperature
- Ambient temperature and humidity
- Sensor status, firmware version, config version, boot count, and time source
- Calibration-mode state and raw HX711 readings

Off-grid telemetry:

- Battery voltage and state-of-charge
- Battery alert and monitor status
- Solar/load voltage, current, and power
- Solar monitor status
- Network transport, cellular status, cellular CSQ, and RSSI

See `apps/hivescale/hivescale-integration.md` and `docs/docs/user-guide/hivescale.md` for user/admin documentation.

## Testing

This project uses two complementary testing frameworks:

### Vitest (Unit Tests)

Vitest is used for unit testing pure logic, utilities, hooks, and stores. Test files follow the pattern `**/*.{test,spec}.{ts,tsx}`.

**When to use Vitest:**
- Pure functions and utility modules
- Custom React hooks (without complex DOM interactions)
- State management stores (Zustand stores)
- Business logic and data transformations
- Type utilities and helper functions

**Running Vitest:**
```bash
pnpm test           # Run tests once
pnpm test:watch     # Watch mode for development
```

**Configuration:** `vitest.config.ts`
- Explicit imports required (`import { describe, it, expect } from 'vitest'`)
- JSDOM environment for DOM-dependent tests
- Inherits path aliases from Vite config

### Playwright Component Testing

Playwright Component Testing is used for testing React components with full DOM rendering and user interactions. Test files follow the pattern `**/*.ct.{ts,tsx}`.

**When to use Playwright CT:**
- React components requiring DOM rendering
- User interaction flows (clicks, form inputs, etc.)
- Visual regression testing
- Components with complex lifecycle behavior
- Integration tests between multiple components

**Running Playwright CT:**
```bash
pnpm test:ct        # Run component tests
```

### Testing Strategy

Choose the appropriate framework based on what you are testing:

- **Vitest**: Fast, lightweight tests for isolated logic
- **Playwright CT**: Comprehensive component tests with real browser behavior

Both frameworks coexist and complement each other to provide complete test coverage.


## Testing

This project uses two complementary testing frameworks:

### Vitest (Unit Tests)

Vitest is used for unit testing pure logic, utilities, hooks, and stores. Test files follow the pattern `**/*.{test,spec}.{ts,tsx}`.

**When to use Vitest:**
- Pure functions and utility modules
- Custom React hooks (without complex DOM interactions)
- State management stores (Zustand stores)
- Business logic and data transformations
- Type utilities and helper functions

**Running Vitest:**
```bash
pnpm test           # Run tests once
pnpm test:watch     # Watch mode for development
```

**Configuration:** `vitest.config.ts`
- Explicit imports required (`import { describe, it, expect } from 'vitest'`)
- JSDOM environment for DOM-dependent tests
- Inherits path aliases from Vite config

### Playwright Component Testing

Playwright Component Testing is used for testing React components with full DOM rendering and user interactions. Test files follow the pattern `**/*.ct.{ts,tsx}`.

**When to use Playwright CT:**
- React components requiring DOM rendering
- User interaction flows (clicks, form inputs, etc.)
- Visual regression testing
- Components with complex lifecycle behavior
- Integration tests between multiple components

**Running Playwright CT:**
```bash
pnpm test:ct        # Run component tests
```

### Testing Strategy

Choose the appropriate framework based on what you are testing:

- **Vitest**: Fast, lightweight tests for isolated logic
- **Playwright CT**: Comprehensive component tests with real browser behavior

Both frameworks coexist and complement each other to provide complete test coverage.

