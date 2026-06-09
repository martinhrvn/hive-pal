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
  | X-HivePal-Service-Key + Authorization: Bearer <user JWT>
  v
HiveScale backend (FastAPI)
  | stores measurements, devices, roles, config, commands
  v
HiveScale PostgreSQL database
```

The HivePal backend authenticates outbound requests to HiveScale with `HIVESCALE_SERVICE_API_KEY` and forwards the logged-in user's JWT access token in the `Authorization: Bearer <token>` header. HiveScale validates the JWT to identify the user and enforces device ownership and roles; HivePal does not bypass those checks.

> **Migration note:** Earlier versions forwarded the HivePal user ID in an `X-User-Id` header. The backend now forwards the user's JWT access token in `Authorization: Bearer <token>` instead. The HiveScale backend must be able to validate HivePal-issued JWTs (it must share/trust the same `JWT_SECRET`) for the integration to work.

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
| `POST /hivescale/devices/:deviceId/measurements/import` | `POST /api/v1/app/devices/:id/measurements/import` | Import an SD-card backup (`.ndjson`/`.tar`) the beekeeper downloaded in AP mode |
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
| `useImportHiveScaleSdData(deviceId)` | Upload an SD-card backup file (`.ndjson`/`.tar`) and bulk-import its readings |
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
- **Import SD card data card** for uploading a `measurements.ndjson` or `hivescale-sd-data.tar` backup pulled from the device in AP mode (owners/admins only).
- **Device config card** for send interval and calibration values.
- **Scale mapping card** for matching scale channels to hive names.
- **Device status and sharing card** for role, last seen time, firmware, and members.

---

## SD card data import

HiveScale devices keep an append-only backup of every reading on their SD card
(`measurements.ndjson`), plus a `cache.ndjson` retry queue. When a device has
been offline or off-grid, those readings never reached the backend over the
network. The beekeeper can download the card contents in AP mode as
`hivescale-sd-data.tar` and upload them into HivePal to backfill the history.

### Data flow

```text
Scale SD card (measurements.ndjson + cache.ndjson)
  | AP-mode download (HiveScale firmware, GET /sd/download-all)
  v
hivescale-sd-data.tar  (or an extracted .ndjson)
  | multipart upload, field name "file"
  v
HivePal frontend  (SdDataUploadCard / useImportHiveScaleSdData)
  | POST /api/hivescale/devices/:deviceId/measurements/import
  v
HivePal backend  (parse + chunk + forward)
  | POST /api/v1/app/devices/:id/measurements/import
  v
HiveScale backend (idempotent bulk insert)
```

### Backend proxy

The import is handled by `apps/backend/src/hivescale/` and, unlike the other
proxy routes, does **not** stream the request straight through — it parses the
upload in the HivePal backend first:

| Concern | Location | Notes |
|---|---|---|
| HTTP endpoint | `hivescale.controller.ts` → `importSdMeasurements()` | `POST devices/:deviceId/measurements/import`, multipart `file` via `FileInterceptor`; rejects an empty upload with `400 No SD data file provided`. |
| File parsing | `sd-import.parser.ts` → `parseSdMeasurements()` | Pure, dependency-free. Detects `.tar` from the filename or the USTAR magic at offset 257, extracts every `*.ndjson` member, and parses NDJSON line-by-line. Blank/corrupt lines are counted as `skipped`, not fatal. |
| Forwarding | `hivescale.service.ts` → `importSdMeasurements()` | Pins every record's `device_id` to the path device, then forwards in chunks of `SD_IMPORT_CHUNK_SIZE` (5000) so a multi-month backup stays under the backend's 20000-row-per-request cap. Aggregates the per-chunk counts. |

The HiveScale backend caps each request at 20000 measurements
(`MEASUREMENT_IMPORT_MAX`), which is why HivePal chunks at 5000.

### Accepted files

| Upload | Handling |
|---|---|
| `hivescale-sd-data.tar` | Every `*.ndjson` member is extracted and concatenated (`measurements.ndjson` + `cache.ndjson`). |
| `measurements.ndjson` (or any `.ndjson`) | Parsed directly as one JSON object per line. |
| Mislabelled file | Falls back to sniffing the USTAR magic, so a `.tar` without the extension still parses. |

### Idempotency

Re-uploading is always safe. The HiveScale backend treats
`(device_id, measured_at)` as the natural key, so rows that already exist —
whether they arrived earlier over the network, are repeated inside the file, or
were uploaded before — are skipped rather than duplicated. Duplicate detection
is in HiveScale's `sd_import.split_new_and_duplicate`.

### Import result

`useImportHiveScaleSdData` returns a `HiveScaleSdImportResult` that the
`SdDataUploadCard` surfaces to the user:

| Field | Meaning |
|---|---|
| `parsed` | Records successfully parsed out of the uploaded file |
| `skipped` | Non-empty lines that could not be parsed as JSON |
| `received` | Records the HiveScale backend accepted across all chunks |
| `inserted` | New readings stored |
| `duplicates` | Readings skipped because they already existed |

### Access control

Importing requires `owner` or `admin` on the device. HiveScale re-checks the
role server-side and never auto-creates devices from uploaded data — the
`device_id` inside the file is ignored in favour of the claimed device the user
selected, so an upload cannot smuggle readings into a device the user does not
own.

---

## Device pairing flow

1. Flash the ESP32 firmware with a `CLAIM_CODE` in `secrets.h`.
2. The device sends at least one measurement containing that claim code.
3. In HivePal, open **HiveScale** and submit the same claim code.
4. HivePal calls its backend `POST /hivescale/devices/claim` route.
5. The HivePal backend forwards to HiveScale with the service key and the current user's JWT access token (`Authorization: Bearer <token>`).
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

### `401 Invalid or expired token`

The user's JWT access token was rejected by HiveScale. This usually means the HiveScale backend cannot validate HivePal-issued JWTs (mismatched `JWT_SECRET`), or the token has expired. Confirm both backends share the same `JWT_SECRET` and that the user is signed in with a valid session.

### `404 No unclaimed device found for this claim code`

The device has not sent its first measurement, the code is wrong, or the device is already claimed.

### No measurements in HivePal

Check the device's `last_seen_at`, HiveScale logs, ESP32 serial output, and whether HivePal can reach `HIVESCALE_API_BASE_URL` from the backend container.

### Off-grid cards are empty

Confirm the firmware was built with the relevant flags enabled, the modules are wired correctly, and HiveScale returns the off-grid fields through `/api/v1/app/devices/:id/measurements/latest`.

### Sharing by email fails

The email must belong to an existing HivePal user. HivePal resolves email to user ID before calling HiveScale.

### SD import says "No measurements found in the uploaded file"

The parser could not find any valid NDJSON records. Confirm the file is a
HiveScale `measurements.ndjson` backup or the `hivescale-sd-data.tar` download
(not an unrelated archive), and that it is not empty or truncated. The import
also reports a `skipped` count for individual lines that were corrupt or
truncated while the rest imported normally.

### SD import reports many duplicates

This is expected when the device was online: those readings already reached the
backend over the network, so the SD backup overlaps with stored data. Only the
genuinely new (offline/off-grid) readings count toward `inserted`.
