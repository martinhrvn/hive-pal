# HiveScale integration in HivePal

This document explains how HivePal connects to a self-hosted HiveScale backend to display live weight, temperature, power, and connectivity data from ESP32-based beehive scales.

---

## Overview

HiveScale is a separate self-hosted service. HivePal does not store scale measurements in its own database. Instead, HivePal acts as an authenticated proxy between the HivePal frontend and the HiveScale backend.

```text
HivePal frontend
  | JWT auth
  v
HivePal backend (NestJS)
  | X-HivePal-Service-Key + X-User-Id
  v
HiveScale backend (FastAPI)
  | stores measurements, devices, roles, config, commands
  v
HiveScale PostgreSQL database
```

The HivePal backend authenticates outbound requests to HiveScale with `HIVESCALE_SERVICE_API_KEY` and forwards the logged-in HivePal user ID in `X-User-Id`. HiveScale enforces device ownership and roles; HivePal does not bypass those checks.

---

## Self-hosting requirements

To enable the integration, run a HiveScale backend and configure the HivePal backend with:

| Variable | Description |
|---|---|
| `HIVESCALE_API_BASE_URL` | Base URL of the HiveScale API, for example `https://hivescale.example.com` |
| `HIVESCALE_SERVICE_API_KEY` | Shared secret used by HivePal to call HiveScale |

The HivePal `HIVESCALE_SERVICE_API_KEY` must match `HIVEPAL_SERVICE_API_KEY` on the HiveScale side.

Example HivePal `.env`:

```env
HIVESCALE_API_BASE_URL=https://hivescale.example.com
HIVESCALE_SERVICE_API_KEY=a-long-random-shared-secret
```

Example HiveScale `.env`:

```env
HIVEPAL_SERVICE_API_KEY=a-long-random-shared-secret
```

Generate a strong shared key with:

```bash
openssl rand -hex 32
```

`apps/hivescale/docker-compose.hivescale.yaml` shows how to run HiveScale alongside HivePal for local or single-host deployments.

---

## HiveScale backend capabilities used by HivePal

HivePal uses the HiveScale app API under `/api/v1/app/...`.

| HivePal backend route | HiveScale route | Purpose |
|---|---|---|
| `POST /hivescale/devices/claim` | `POST /api/v1/app/devices/claim` | Claim an unclaimed scale by claim code |
| `GET /hivescale/devices` | `GET /api/v1/app/devices` | List the user's devices |
| `DELETE /hivescale/devices/:deviceId` | `DELETE /api/v1/app/devices/:id` | Remove current user's membership |
| `GET /hivescale/devices/:deviceId/config` | `GET /api/v1/app/devices/:id/config` | Read send interval and calibration config |
| `PATCH /hivescale/devices/:deviceId/config` | `PATCH /api/v1/app/devices/:id/config` | Update send interval and calibration config |
| `PATCH /hivescale/devices/:deviceId/channels` | `PATCH /api/v1/app/devices/:id/channels` | Rename scale 1 and scale 2 |
| `GET /hivescale/devices/:deviceId/measurements` | `GET /api/v1/app/devices/:id/measurements` | Read measurements for charts and history |
| `GET /hivescale/devices/:deviceId/measurements/latest` | `GET /api/v1/app/devices/:id/measurements/latest` | Read latest measurement/status cards |
| `GET /hivescale/devices/:deviceId/members` | `GET /api/v1/app/devices/:id/members` | Read device members, then enrich with HivePal user data |
| `POST /hivescale/devices/:deviceId/members` | `POST /api/v1/app/devices/:id/members` | Share by email after HivePal resolves the target user ID |
| `DELETE /hivescale/devices/:deviceId/members/:memberUserId` | `DELETE /api/v1/app/devices/:id/members/:user_id` | Revoke member access |

HivePal also contains calibration-mode start/stop hooks and controller routes. These are intended for HiveScale deployments that expose app-level calibration endpoints; otherwise calibration can still be driven through HiveScale's command queue.

---

## Measurement fields displayed by HivePal

HivePal's `HiveScaleMeasurement` type includes both the original scale fields and the off-grid telemetry fields.

### Core readings

| Field | UI use |
|---|---|
| `scale_1_weight_kg`, `scale_2_weight_kg` | Latest readings and weight charts |
| `hive_1_temp_c`, `hive_2_temp_c` | Hive temperature cards and charts |
| `ambient_temp_c`, `ambient_humidity_percent` | Ambient status cards and charts |
| `scale_1_raw`, `scale_2_raw` | Calibration/debug context |
| `firmware_version`, `config_version` | Device status/debug context |
| `sd_ok`, `rtc_ok`, `sht_ok` | Sensor/module health |
| `calibration_mode` | Shows whether fast calibration sampling is active |
| `boot_count`, `time_source` | Device diagnostics |

### Off-grid readings

| Field | UI use |
|---|---|
| `battery_voltage` / `battery_voltage_v` | Battery voltage card and chart |
| `battery_soc_percent` | Battery state-of-charge card and chart |
| `battery_alert` | Battery alert status |
| `battery_monitor_ok` | MAX17048 health |
| `solar_monitor_ok` | INA219 health |
| `solar_load_voltage_v` | Solar/load voltage card and chart |
| `solar_current_ma` | Solar/load current card and chart |
| `solar_power_mw` | Solar/load power card and chart |
| `network_transport` | Displays Wi-Fi vs SIM7080G transport |
| `cellular_ok` | Cellular connection status |
| `cellular_csq` | Cellular signal quality chart/status |
| `rssi_dbm` | Wi-Fi RSSI or CSQ-derived approximate RSSI |

---

## Frontend integration

### API hooks

`apps/frontend/src/api/hooks/useHiveScale.ts` is the frontend API layer. It calls only HivePal backend paths under `/api/hivescale/...`.

Read hooks:

| Hook | Auto-refresh | Description |
|---|---:|---|
| `useHiveScaleDevices()` | 30 s | List claimed/shared devices |
| `useHiveScaleMeasurements(deviceId, query)` | 60 s | Measurements with `limit`, `start_at`, and `end_at` |
| `useHiveScaleDeviceConfig(deviceId)` | - | Device config |
| `useHiveScaleMembers(deviceId)` | - | Device members enriched with HivePal user info |

Write hooks:

| Hook | Description |
|---|---|
| `useClaimHiveScaleDevice()` | Claim by claim code |
| `useRemoveHiveScaleDevice()` | Remove current user's membership |
| `useUpdateHiveScaleConfig(deviceId)` | Update interval and calibration config |
| `useUpdateHiveScaleChannels(deviceId)` | Rename scale channels |
| `useShareHiveScaleDevice(deviceId)` | Share with another HivePal user by email |
| `useRevokeHiveScaleMember(deviceId)` | Revoke member access |
| `useStartHiveScaleCalibrationMode(deviceId)` | Start fast calibration sampling where supported |
| `useStopHiveScaleCalibrationMode(deviceId)` | Stop calibration mode where supported |

### HiveScale page

`apps/frontend/src/pages/hivescale/hivescale-page.tsx` is the main UI.

It includes:

- **Device selector** for switching between claimed or shared HiveScale devices.
- **Claim device card** for pairing by claim code and assigning display names.
- **Live readings panel** for latest scale weights, hive temperatures, ambient readings, and module status.
- **Off-grid status cards** for battery voltage, battery state-of-charge, battery alert, solar voltage/current/power, network transport, cellular connection state, and CSQ.
- **Chart panel** with preset and custom date ranges for weight, temperature, battery, solar, and cellular signal data.
- **Calibration controls** for entering fast sampling mode during tare/known-weight calibration.
- **Device config card** for send interval and calibration values.
- **Scale mapping card** for matching scale channels to hive names.
- **Device status and sharing card** for role, last seen time, firmware, and members.

---

## Device pairing flow

1. Flash the ESP32 firmware with a `CLAIM_CODE` in `secrets.h`.
2. The device sends at least one measurement containing that claim code.
3. In HivePal, open **HiveScale** and submit the same claim code.
4. HivePal calls its backend `POST /hivescale/devices/claim` route.
5. The HivePal backend forwards to HiveScale with the service key and current user ID.
6. HiveScale hashes the claim code, matches the unclaimed device, and assigns the user as owner.
7. The device appears in HivePal and the latest measurements populate the dashboard and charts.

---

## Roles

HiveScale enforces roles on the backend.

| Role | Claim | View data | Edit config/channels | Share/revoke members |
|---|---:|---:|---:|---:|
| `owner` | Yes | Yes | Yes | Yes |
| `admin` | No | Yes | Yes | No |
| `viewer` | No | Yes | No | No |

Removing a device from HivePal removes the current user's membership. If no members remain, HiveScale marks the device unclaimed again so it can be re-paired.

---

## Off-grid mode notes

HivePal does not need special configuration to display off-grid telemetry beyond enabling the HiveScale integration. If the firmware sends the extra fields and the HiveScale backend stores/returns them, HivePal displays them automatically.

For off-grid devices:

- `network_transport` should be `sim7080g` when cellular is used.
- Battery cards are populated from `battery_voltage_v`, `battery_soc_percent`, `battery_alert`, and `battery_monitor_ok`.
- Solar cards are populated from the INA219 fields.
- Cellular cards are populated from `cellular_ok`, `cellular_csq`, and `rssi_dbm`.
- The chart panel can plot battery, solar, and cellular history alongside weight and temperature history.

---

## Troubleshooting

### `500 HIVESCALE_API_BASE_URL is not configured`

Set `HIVESCALE_API_BASE_URL` in the HivePal backend environment and restart the backend.

### `500 HIVESCALE_SERVICE_API_KEY is not configured`

Set `HIVESCALE_SERVICE_API_KEY` in the HivePal backend environment and restart the backend.

### `401 Invalid HivePal service key`

The HivePal `HIVESCALE_SERVICE_API_KEY` does not match HiveScale's `HIVEPAL_SERVICE_API_KEY`.

### `404 No unclaimed device found for this claim code`

The device has not sent its first measurement, the code is wrong, or the device is already claimed.

### No measurements in HivePal

Check the device's `last_seen_at`, HiveScale logs, ESP32 serial output, and whether HivePal can reach `HIVESCALE_API_BASE_URL` from the backend container.

### Off-grid cards are empty

Confirm the firmware was built with the relevant flags enabled, the modules are wired correctly, and HiveScale returns the off-grid fields through `/api/v1/app/devices/:id/measurements/latest`.

### Sharing by email fails

The email must belong to an existing HivePal user. HivePal resolves email to user ID before calling HiveScale.
