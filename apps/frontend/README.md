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
