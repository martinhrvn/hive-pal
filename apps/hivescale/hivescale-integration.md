# HiveScale Integration in HivePal

This document explains how HivePal connects to a self-hosted [HiveScale](https://github.com/MacNite/HiveScale) backend to display live weight and temperature data from ESP32-based beehive scales.

---

## Overview

HiveScale is a separate, self-hosted service. HivePal does not store scale data itself — it acts as an authenticated proxy, forwarding requests from the frontend to the HiveScale backend on behalf of the logged-in user.

```
HivePal Frontend
      │  JWT auth
      ▼
HivePal Backend (NestJS)
      │  X-HivePal-Service-Key + X-User-Id
      ▼
HiveScale Backend (FastAPI)          ← measurements stored here
      │
      ▼
PostgreSQL (HiveScale DB)
```

The HivePal backend authenticates every outbound request to HiveScale using its own `HIVESCALE_SERVICE_API_KEY`, and forwards the logged-in HivePal user's ID in the `X-User-Id` header. The HiveScale backend uses this to enforce per-user device ownership and role checks — HivePal never bypasses them.

---

## Self-hosting requirements

To enable the integration you need a running HiveScale backend. See the [HiveScale repository](https://github.com/MacNite/HiveScale) for hardware, firmware, and server setup instructions.

Once HiveScale is running, add two environment variables to your **HivePal backend**:

| Variable | Description |
|---|---|
| `HIVESCALE_API_BASE_URL` | Base URL of your HiveScale API, e.g. `https://hivescale.example.com` |
| `HIVESCALE_SERVICE_API_KEY` | Shared secret between HivePal and HiveScale |

The `HIVESCALE_SERVICE_API_KEY` value must match `HIVEPAL_SERVICE_API_KEY` set on the HiveScale side. If either variable is missing or the values do not match, all HiveScale calls from HivePal will return `500 Internal Server Error` or `401 Unauthorized`.

### Docker Compose

The `docker-compose.hivescale.yaml` file in the HivePal repository shows how to run HiveScale alongside HivePal. The relevant environment block in the HivePal backend service is:

```yaml
HIVESCALE_API_BASE_URL: ${HIVESCALE_API_BASE_URL:-}
HIVESCALE_SERVICE_API_KEY: ${HIVESCALE_SERVICE_API_KEY:-}
```

Add the matching values to your HivePal `.env` file:

```env
HIVESCALE_API_BASE_URL=https://hivescale.example.com
HIVESCALE_SERVICE_API_KEY=a-long-random-shared-secret
```

And in the HiveScale `.env`:

```env
HIVEPAL_SERVICE_API_KEY=a-long-random-shared-secret
```

Both values must be identical. Generate a strong secret with:

```bash
openssl rand -hex 32
```

---

## Backend integration

### Module

`apps/backend/src/hivescale/hivescale.module.ts` registers `HiveScaleController` and `HiveScaleService`. It imports:

- `AuthModule` — for JWT guard on all routes
- `ConfigModule` — for reading `HIVESCALE_API_BASE_URL` and `HIVESCALE_SERVICE_API_KEY`
- `UsersModule` — for resolving HivePal user emails when enriching device member lists

### Service (`hivescale.service.ts`)

`HiveScaleService` makes all outbound HTTP requests to the HiveScale backend using `axios`. Every request includes:

```
X-HivePal-Service-Key: <HIVESCALE_SERVICE_API_KEY>
X-User-Id: <HivePal user ID from JWT>
```

Two additional responsibilities beyond plain proxying:

**Email → user ID mapping for sharing.** When a HivePal user shares a device with another user by email address, `UsersService.findByEmail()` looks up the target HivePal user and their internal ID is passed to HiveScale's member endpoint. HiveScale only stores and checks user IDs, not email addresses.

**User ID → user info enrichment for member lists.** When listing device members, the HiveScale response only contains `user_id` values. The service calls the HivePal user table to attach the matching email and display name, so the frontend can show human-readable member information.

### Controller (`hivescale.controller.ts`)

All routes are under `/hivescale` and are protected by `JwtAuthGuard`. The controller extracts `req.user.id` from the JWT and delegates to `HiveScaleService`.

| Method | Route | HiveScale endpoint proxied to |
|---|---|---|
| `POST` | `/hivescale/devices/claim` | `POST /api/v1/app/devices/claim` |
| `GET` | `/hivescale/devices` | `GET /api/v1/app/devices` |
| `DELETE` | `/hivescale/devices/:deviceId` | `DELETE /api/v1/app/devices/:id` |
| `GET` | `/hivescale/devices/:deviceId/config` | `GET /api/v1/app/devices/:id/config` |
| `PATCH` | `/hivescale/devices/:deviceId/config` | `PATCH /api/v1/app/devices/:id/config` |
| `PATCH` | `/hivescale/devices/:deviceId/channels` | `PATCH /api/v1/app/devices/:id/channels` |
| `GET` | `/hivescale/devices/:deviceId/measurements` | `GET /api/v1/app/devices/:id/measurements` |
| `GET` | `/hivescale/devices/:deviceId/measurements/latest` | `GET /api/v1/app/devices/:id/measurements/latest` |
| `GET` | `/hivescale/devices/:deviceId/members` | `GET /api/v1/app/devices/:id/members` (+ user enrichment) |
| `POST` | `/hivescale/devices/:deviceId/members` | `POST /api/v1/app/devices/:id/members` (email → ID lookup) |
| `DELETE` | `/hivescale/devices/:deviceId/members/:memberUserId` | `DELETE /api/v1/app/devices/:id/members/:user_id` |

For a full description of request/response schemas for each HiveScale endpoint, see the [HiveScale API reference](https://github.com/MacNite/HiveScale/blob/main/docs/api.md).

---

## Frontend integration

### API hooks (`apps/frontend/src/api/hooks/useHiveScale.ts`)

The frontend communicates only with the HivePal backend — never directly with HiveScale. All hooks call paths under `/api/hivescale/…`.

**Query hooks (read):**

| Hook | Auto-refresh | Description |
|---|---|---|
| `useHiveScaleDevices()` | Every 30 s | List all devices claimed by the user |
| `useHiveScaleMeasurements(deviceId, query)` | Every 60 s | Measurements for a device; accepts `limit`, `start_at`, `end_at` |
| `useHiveScaleDeviceConfig(deviceId)` | — | Remote configuration for a device |
| `useHiveScaleMembers(deviceId)` | — | Members with access to the device (with HivePal user info) |

**Mutation hooks (write):**

| Hook | Description |
|---|---|
| `useClaimHiveScaleDevice()` | Claim a device by claim code |
| `useRemoveHiveScaleDevice()` | Remove a device from the user's account |
| `useUpdateHiveScaleConfig(deviceId)` | Update send interval and calibration values |
| `useUpdateHiveScaleChannels(deviceId)` | Rename scale channels (Scale 1 / Scale 2) |
| `useShareHiveScaleDevice(deviceId)` | Share device with another HivePal user by email |
| `useRevokeHiveScaleMember(deviceId)` | Revoke a member's access |

### HiveScale page (`apps/frontend/src/pages/hivescale/hivescale-page.tsx`)

The HiveScale page is accessible from the main navigation. It is always rendered when `HIVESCALE_API_BASE_URL` is configured — if no device has been claimed yet, it shows an empty device list and the claim form.

The page contains the following panels and cards:

**Device selector** — a dropdown to switch between multiple claimed devices when a user owns or has access to more than one.

**Live readings panel** — displays the latest weight (kg) for each scale and temperature readings from both hive probes and the ambient sensor. Values are pulled from the `measurements/latest` endpoint.

**Chart panel (`HiveScaleDiagramPanel`)** — time-series line charts for weight and temperature. Preset date ranges (1 h, 24 h, 7 d, 30 d) and a custom range picker drive the `start_at` / `end_at` query parameters. HivePal inspection events for the associated hive are overlaid on the chart as markers, so weight changes can be correlated with beekeeping activity.

**Claim device card** — a form to claim a new device. The user enters the claim code printed on or flashed into the device (e.g. `ABCD-1234`) along with optional display names for the device and each scale channel. Autocomplete suggests names from the user's existing hives.

**Device status card** — shows the device ID, the current user's role, last measurement timestamp, and the member management UI. Owners can share the device with other HivePal users by email address and revoke access at any time.

**Scale mapping card** — lets owners and admins rename Scale 1 and Scale 2 to match HivePal hive names. Autocomplete suggests existing hive names.

**Device config card** — lets owners and admins adjust the send interval (minimum 60 s). Changes are applied to the device on its next measurement cycle.

---

## Device pairing flow

1. Flash the ESP32 firmware with a `CLAIM_CODE` set in `secrets.h` (e.g. `ABCD-1234`). See the [HiveScale firmware setup guide](https://github.com/MacNite/HiveScale#firmware-setup).
2. The device powers on, connects to Wi-Fi, and begins sending measurements to the HiveScale backend. The claim code is included in every measurement until the device is claimed.
3. In HivePal, navigate to the **HiveScale** page and fill in the **Claim device** form with the same claim code and optional display names.
4. HivePal calls `POST /hivescale/devices/claim` → proxied to `POST /api/v1/app/devices/claim` on HiveScale.
5. HiveScale matches the hashed claim code, marks the device as claimed, and assigns the HivePal user as owner.
6. The device appears in the device selector and measurement data starts populating the charts.

---

## Member roles

Roles are enforced entirely on the HiveScale backend. HivePal forwards the user ID and HiveScale checks the `device_members` table before executing any write operation.

| Role | Claim device | View data | Edit config & channels | Share / revoke members |
|---|---|---|---|---|
| `owner` | ✅ (becomes owner) | ✅ | ✅ | ✅ |
| `admin` | — | ✅ | ✅ | — |
| `viewer` | — | ✅ | — | — |

Removing a device (`DELETE /hivescale/devices/:deviceId`) removes the current user's own membership. If no members remain, the device reverts to unclaimed and can be re-paired with its original claim code.

---

## Feature flag

The HiveScale page and navigation items are shown whenever `HIVESCALE_API_BASE_URL` is set in the HivePal backend environment. There is no separate frontend feature flag — the page is always rendered. If the variable is not set, all calls will return a `500` error with the message `HIVESCALE_API_BASE_URL is not configured on the HivePal backend`, which surfaces in the UI.

---

## Data flow reference

```
ESP32 firmware
  │  POST /api/v1/measurements   (X-API-Key)
  ▼
HiveScale backend                              stores in measurements table
  │  GET /api/v1/app/devices/:id/measurements  (X-HivePal-Service-Key + X-User-Id)
  ▼
HivePal backend (NestJS proxy)                 role-check via device_members
  │  GET /api/hivescale/devices/:id/measurements  (JWT)
  ▼
HivePal frontend                               displayed in HiveScaleDiagramPanel
```

---

## Troubleshooting

**`500 HIVESCALE_API_BASE_URL is not configured`**
Set `HIVESCALE_API_BASE_URL` in the HivePal backend environment and restart the service.

**`401 Invalid HivePal service key`**
The `HIVESCALE_SERVICE_API_KEY` in HivePal does not match `HIVEPAL_SERVICE_API_KEY` in HiveScale. Both must be set to the same value.

**`404 No unclaimed device found for this claim code`**
Either the claim code is wrong, the device has not sent its first measurement yet (HiveScale won't know about it until it does), or the device is already claimed by another user. Check the HiveScale logs or the `devices` table directly.

**No measurements appearing in the chart**
Verify the device is online and the HiveScale backend is reachable from HivePal. Check `last_seen_at` in the device status card, and inspect the ESP32 serial output at 115200 baud.

**Charts show stale data**
The measurement query auto-refetches every 60 seconds. Use the **Refresh** button on the HiveScale page to force an immediate refetch.

**Sharing by email fails**
The email address must belong to an existing HivePal account. HivePal looks up the user by email before calling HiveScale, so the share will be rejected if no matching account is found.