# HiveScale Integration in HivePal

This document explains how HivePal connects to a self-hosted HiveScale backend to display live weight and temperature data from ESP32-based beehive scales.

---

## Overview

HiveScale is a separate service. HivePal does not store scale data itself — it acts as a proxy, forwarding authenticated requests from the frontend to the HiveScale backend on behalf of the logged-in user.

```
HivePal Frontend
      │  JWT auth
      ▼
HivePal Backend (NestJS)
      │  X-HivePal-Service-Key + X-User-Id
      ▼
HiveScale Backend (FastAPI)
      │  measurements stored here
      ▼
PostgreSQL (HiveScale DB)
```

The HivePal backend authenticates requests with its own `HIVESCALE_SERVICE_API_KEY`, and forwards the HivePal user's ID in the `X-User-Id` header. The HiveScale backend uses this to enforce per-user device ownership and role checks.

---

## Self-Hosting Requirements

To enable the integration, you need a running HiveScale backend. See the [HiveScale repository](../HiveScale/) for setup instructions.

Once HiveScale is running, set two additional environment variables in your HivePal backend:

| Variable | Description |
|---|---|
| `HIVESCALE_API_BASE_URL` | Base URL of your HiveScale API, e.g. `https://hivescale.example.com` |
| `HIVESCALE_SERVICE_API_KEY` | Shared secret between HivePal and HiveScale (`HIVEPAL_SERVICE_API_KEY` in HiveScale) |

Both variables must match between the two services. If either is missing or empty, all HiveScale API calls from HivePal will return `500 Internal Server Error`.

### Docker Compose

The `docker-compose.hivescale.yaml` file in the HivePal repository shows how to run HiveScale alongside HivePal. The relevant environment block in HivePal's backend service is:

```yaml
HIVESCALE_API_BASE_URL: ${HIVESCALE_API_BASE_URL:-}
HIVESCALE_SERVICE_API_KEY: ${HIVESCALE_SERVICE_API_KEY:-}
```

Add these to your `.env` file:

```env
HIVESCALE_API_BASE_URL=https://hivescale.example.com
HIVESCALE_SERVICE_API_KEY=a-long-random-shared-secret
```

And in the HiveScale `.env`:

```env
HIVEPAL_SERVICE_API_KEY=a-long-random-shared-secret
```

---

## Backend Integration

### Module

`apps/backend/src/hivescale/hivescale.module.ts` — registers `HiveScaleController` and `HiveScaleService`. It imports `AuthModule` (for JWT guard), `ConfigModule` (for env vars), and `UsersModule` (for resolving user emails when listing device members).

### Service (`hivescale.service.ts`)

`HiveScaleService` makes all outbound HTTP requests to the HiveScale backend using `axios`. Every request includes two headers:

- `X-HivePal-Service-Key` — the shared `HIVESCALE_SERVICE_API_KEY`
- `X-User-Id` — the HivePal user's ID (from the JWT)

The service maps HivePal email-based sharing to HiveScale user IDs. When a user shares a device with an email address, `UsersService.findByEmail()` is called to look up the HivePal user, and their internal ID is passed to HiveScale.

Similarly, when listing device members, the service enriches the HiveScale response (which only contains `user_id`) with the user's email and name from the HivePal user table.

### Controller (`hivescale.controller.ts`)

All routes are under `/hivescale` and are protected by `JwtAuthGuard`. The controller extracts `req.user.id` from the JWT and delegates everything to `HiveScaleService`.

| Method | Route | Description |
|---|---|---|
| `POST` | `/hivescale/devices/claim` | Claim a device by claim code |
| `GET` | `/hivescale/devices` | List devices for the current user |
| `DELETE` | `/hivescale/devices/:deviceId` | Remove a device from the current user |
| `GET` | `/hivescale/devices/:deviceId/config` | Get device config |
| `PATCH` | `/hivescale/devices/:deviceId/config` | Update device config (owner/admin) |
| `PATCH` | `/hivescale/devices/:deviceId/channels` | Update scale channel names (owner/admin) |
| `GET` | `/hivescale/devices/:deviceId/measurements` | List measurements (with optional date range) |
| `GET` | `/hivescale/devices/:deviceId/measurements/latest` | Latest measurements |
| `GET` | `/hivescale/devices/:deviceId/members` | List device members (with HivePal user info) |
| `POST` | `/hivescale/devices/:deviceId/members` | Share device with a HivePal user by email |
| `DELETE` | `/hivescale/devices/:deviceId/members/:memberUserId` | Revoke a member's access |

All these are proxied to the corresponding `/api/v1/app/devices/…` endpoints on the HiveScale backend.

---

## Frontend Integration

### API Hooks (`apps/frontend/src/api/hooks/useHiveScale.ts`)

The frontend communicates with HivePal's backend (not directly with HiveScale). All hooks call paths under `/api/hivescale/…`:

| Hook | Purpose |
|---|---|
| `useHiveScaleDevices()` | List all devices claimed by the user. Refreshes every 30 s. |
| `useHiveScaleMeasurements(deviceId, query)` | Fetch measurements for a device. Accepts `limit`, `start_at`, `end_at`. Auto-refetches every 60 s. |
| `useHiveScaleDeviceConfig(deviceId)` | Get the device's remote configuration. |
| `useHiveScaleMembers(deviceId)` | List members who have access to the device. |
| `useClaimHiveScaleDevice()` | Mutation — claim a device by claim code. |
| `useRemoveHiveScaleDevice()` | Mutation — remove a device from the user's account. |
| `useUpdateHiveScaleConfig(deviceId)` | Mutation — update send interval and calibration values. |
| `useUpdateHiveScaleChannels(deviceId)` | Mutation — rename scale channels (Scale 1 / Scale 2). |
| `useShareHiveScaleDevice(deviceId)` | Mutation — share device with another HivePal user by email. |
| `useRevokeHiveScaleMember(deviceId)` | Mutation — revoke a member's access. |

### HiveScale Page (`apps/frontend/src/pages/hivescale/hivescale-page.tsx`)

The HiveScale page is accessible from the main navigation. It provides:

- **Device selector** — pick between multiple claimed devices.
- **Live readings panel** — displays the latest weight and temperature for each scale and the ambient sensor.
- **Chart panel** (`HiveScaleDiagramPanel`) — time-series charts with preset date ranges (1 h, 24 h, 7 d, 30 d) and inspection event markers overlaid from HivePal inspection data.
- **Claim device card** — form to claim a new device by entering its claim code and optional display names. Autocomplete suggests names from the user's existing hives.
- **Device status card** — shows device ID, role, last measurement time, and member management (share/revoke, owner only).
- **Scale mapping card** — rename Scale 1 and Scale 2 to match HivePal hive names. Autocomplete suggests existing hive names.
- **Device config card** — adjust the send interval (minimum 60 s).

---

## Device Pairing Flow

1. Flash the ESP32 firmware with a `CLAIM_CODE` set in `secrets.h` (e.g. `ABCD-1234`).
2. The device powers on, connects to Wi-Fi, and starts sending measurements to the HiveScale backend. The claim code is included in every measurement until the device is claimed.
3. In HivePal, navigate to the HiveScale page and fill in the **Claim device** form with the same claim code and optional display names.
4. HivePal calls `POST /hivescale/devices/claim`, which proxies to `POST /api/v1/app/devices/claim` on the HiveScale backend.
5. The HiveScale backend matches the hashed claim code, marks the device as claimed, and assigns the HivePal user as owner.
6. The device appears in the device list and data starts flowing into the charts.

---

## Member Roles

| Role | Claim | View data | Edit config / channels | Share / revoke |
|---|---|---|---|---|
| `owner` | ✅ (becomes owner) | ✅ | ✅ | ✅ |
| `admin` | — | ✅ | ✅ | — |
| `viewer` | — | ✅ | — | — |

Roles are enforced on the HiveScale backend. HivePal forwards the user ID, and HiveScale checks `device_members` before executing any action.

Removing a device (`DELETE /hivescale/devices/:deviceId`) removes the current user's membership. If no members remain, the device becomes unclaimed and can be claimed again with its original claim code.

---

## Feature Flag

The HiveScale page and navigation items are always shown when `HIVESCALE_API_BASE_URL` is set in the HivePal backend environment. If the variable is empty, all requests will return a `500` error with the message `HIVESCALE_API_BASE_URL is not configured on the HivePal backend`, which surfaces in the UI.

There is no frontend feature flag — the HiveScale page is always rendered. If you are not using a HiveScale device, the page simply shows an empty device list and the claim form.

---

## Troubleshooting

**`500 HIVESCALE_API_BASE_URL is not configured`**
→ Set `HIVESCALE_API_BASE_URL` in the HivePal backend environment and restart the service.

**`401 Invalid HivePal service key`**
→ The `HIVESCALE_SERVICE_API_KEY` in HivePal does not match `HIVEPAL_SERVICE_API_KEY` in HiveScale. Make sure both are set to the same value.

**`404 No unclaimed device found for this claim code`**
→ Either the claim code is wrong, the device has not sent its first measurement yet (so HiveScale does not know about it), or the device is already claimed. Check the HiveScale logs or the `devices` table.

**No measurements appearing in the chart**
→ Verify the device is online and the HiveScale backend is reachable. Check `last_seen_at` in the devices list, and inspect the device's serial output at 115200 baud.

**Charts show stale data**
→ The measurement query auto-refetches every 60 seconds. Use the **Refresh** button on the HiveScale page to force an immediate refetch.

---

## Data Flow Reference

```
ESP32 firmware
  │  POST /api/v1/measurements   (X-API-Key)
  ▼
HiveScale backend                            stores in measurements table
  │  GET /api/v1/app/devices/:id/measurements (X-HivePal-Service-Key + X-User-Id)
  ▼
HivePal backend (proxy)                      role-check via device_members
  │  GET /api/hivescale/devices/:id/measurements  (JWT)
  ▼
HivePal frontend                             displayed in HiveScaleDiagramPanel
```