# HiveHub integration in HivePal

This document explains how HivePal connects to a self-hosted HiveHub backend (formerly HiveScale) to display weight, in-hive climate, traffic, sound, power, and connectivity data from ESP32-based hubs with up to 18 hives each.

Code and route names still use `hivescale` (`apps/backend/src/hivescale/`, `/api/hivescale/*`, `apps/frontend/src/pages/hivescale/`); the UI says HiveHub.

---

## Overview

HiveHub is a separate self-hosted service. HivePal does not store measurements in its own database. The HivePal backend is an authenticated proxy between the HivePal frontend and the HiveHub app API.

```text
HivePal frontend
  | HivePal session
  v
HivePal backend (NestJS)
  | X-HivePal-Service-Key + Authorization: Bearer <JWT signed by HivePal>
  v
HiveHub backend (FastAPI)
  | stores measurements, devices, roles, config, commands, inspections, recordings
  v
HiveHub PostgreSQL database
```

For every proxied call the HivePal backend:

- sends `HIVEHUB_SERVICE_API_KEY` in `X-HivePal-Service-Key`, and
- signs a JWT for the current user (`sub` = HivePal user id, plus `email`, `role`, `name`; 7-day expiry) with HivePal's `JWT_SECRET` and sends it as `Authorization: Bearer <token>`. The browser's session cookie is never forwarded (`HiveScaleService.tokenFor()`).

HiveHub verifies the JWT with `HIVEPAL_JWT_SECRET`, takes the user from `sub`, and enforces device membership and roles. HivePal does not bypass those checks.

The only HivePal-side state is the alert-email bookkeeping (`HiveHubAlertNotification` table) and the user's alert preferences. Hive names and HivePal hive links live in HiveHub.

---

## Self-hosting requirements

HivePal backend:

| Variable | Description |
|---|---|
| `HIVEHUB_API_BASE_URL` | Base URL of the HiveHub API, e.g. `https://hivehub.example.com` |
| `HIVEHUB_SERVICE_API_KEY` | Shared secret HivePal sends to HiveHub |
| `JWT_SECRET` | Signs the per-user token forwarded to HiveHub |
| `FRONTEND_URL` | Public HivePal URL, used for links in alert emails |
| `HIVESCALE_SD_IMPORT_MAX_FILE_SIZE` | Optional. Max SD-import upload in bytes (default 250 MB) |
| `HIVEHUB_FIRMWARE_MAX_FILE_SIZE` | Optional. Max firmware upload in bytes (default 16 MB, matching HiveHub's own limit) |

The legacy names `HIVESCALE_API_BASE_URL` and `HIVESCALE_SERVICE_API_KEY` are still accepted; an empty `HIVEHUB_*` value falls back to them. Alert emails also need a working mail provider (see the main README).

HiveHub backend:

| Variable | Must equal |
|---|---|
| `HIVEPAL_SERVICE_API_KEY` | HivePal's `HIVEHUB_SERVICE_API_KEY` |
| `HIVEPAL_JWT_SECRET` | HivePal's `JWT_SECRET` |

Example HivePal `.env`:

```env
HIVEHUB_API_BASE_URL=https://hivehub.example.com
HIVEHUB_SERVICE_API_KEY=a-long-random-shared-secret
JWT_SECRET=another-long-random-secret
FRONTEND_URL=https://hivepal.example.com
```

Example HiveHub `.env`:

```env
HIVEPAL_SERVICE_API_KEY=a-long-random-shared-secret
HIVEPAL_JWT_SECRET=another-long-random-secret
```

Generate keys with:

```bash
openssl rand -hex 32
```

`apps/hivescale/docker-compose.hivescale.yaml` runs the HivePal backend and its PostgreSQL with the HiveHub variables passed through. It does **not** run HiveHub; deploy HiveHub separately (see the HiveHub repository) and point `HIVEHUB_API_BASE_URL` at it.

### HiveHub version

Most routes work with current HiveHub `main`. These need HiveHub server 0.6.0 or newer (`GET /health` reports the version):

- `POST /devices/:id/provisioning/start` (remote setup access point),
- `GET /devices/:id/export/measurements` and `/export/measurements/summary`,
- `POST /devices/:id/measurements/delete`,
- `hive_ids` in `PATCH /devices/:id/channels` (linking slots to HivePal hives),
- per-node relay status fields in `GET /devices/:id/firmware/status`.

An older HiveHub answers `404` for the new routes, so those features fail with an error and the rest keeps working; links sent in `hive_ids` are not stored.

---

## Proxy routes

All routes are under `/api/hivescale`, require a HivePal session, and map to HiveHub's `/api/v1/app/...`. Request bodies are validated with the Zod schemas in `packages/shared-schemas/src/hivehub/hivehub.schema.ts`, which mirror HiveHub's pydantic models. Hive indexes are 1–18 (`HIVEHUB_MAX_HIVES`).

### Devices, sharing, config

| HivePal route | HiveHub route | Purpose |
|---|---|---|
| `POST /devices/claim` | `POST /devices/claim` | Claim by claim code (optional display name, hive 1/2 names) |
| `GET /devices` | `GET /devices` | List the user's devices, incl. `channels.names` / `channels.hive_ids` |
| `DELETE /devices/:deviceId` | `DELETE /devices/:id` | Remove own membership (releases the device when it was the last) |
| `DELETE /devices/:deviceId/claim` | `DELETE /devices/:id/claim` | Owner: drop every member and unclaim |
| `GET /devices/:deviceId/members` | `GET /devices/:id/members` | Members, enriched with HivePal user data |
| `POST /devices/:deviceId/members` | `POST /devices/:id/members` | Share by email (HivePal resolves email → user id) as admin/viewer |
| `DELETE /devices/:deviceId/members/:memberUserId` | `DELETE /devices/:id/members/:user_id` | Revoke access |
| `GET /devices/:deviceId/config` | `GET /devices/:id/config` | Device config |
| `PATCH /devices/:deviceId/config` | `PATCH /devices/:id/config` | Send interval, per-hive calibration (`hive_scales`), temperature compensation, HiveTraffic night mode / time zone / emitter banks, inspection timeout |
| `POST /devices/:deviceId/temp-compensation/fit` | `POST /devices/:id/temp-compensation/fit` | Fit (and optionally apply) a temperature coefficient for one hive |
| `GET /devices/:deviceId/channels` | `GET /devices/:id/channels` | Hive names and links |
| `PATCH /devices/:deviceId/channels` | `PATCH /devices/:id/channels` | Set `names` and `hive_ids` per slot (`"1"`..`"18"`) |
| `POST /devices/:deviceId/calibration/start` | `POST /devices/:id/calibration/start` | Queue fast calibration sampling |
| `POST /devices/:deviceId/calibration/stop` | `POST /devices/:id/calibration/stop` | Queue stop of calibration mode |
| `POST /devices/:deviceId/provisioning/start` | `POST /devices/:id/provisioning/start` | Queue the hub's setup access point *(new HiveHub)* |

### Measurements and data

| HivePal route | HiveHub route | Purpose |
|---|---|---|
| `GET /devices/:deviceId/measurements` | `GET /devices/:id/measurements` | History; `limit` (≤ 20000), `start_at`, `end_at`, `max_points` (server-side down-sampling) |
| `GET /devices/:deviceId/measurements/latest` | `GET /devices/:id/measurements/latest` | Latest measurement(s), optional `limit` |
| `POST /devices/:deviceId/measurements/import` | `POST /devices/:id/measurements/import` | SD-card import (parsed and chunked by HivePal, see below) |
| `POST /devices/:deviceId/measurements/delete` | `POST /devices/:id/measurements/delete` | Owner: delete a range; body `start_at`, `end_at`, `claim_code` *(new HiveHub)* |
| `GET /devices/:deviceId/export/measurements/summary` | `GET /devices/:id/export/measurements/summary` | Count and first/last timestamp for a range *(new HiveHub)* |
| `GET /devices/:deviceId/export/measurements` | `GET /devices/:id/export/measurements` | Streamed NDJSON backup; `start_at`, `end_at`, repeated `hive` *(new HiveHub)* |

### Insights

| HivePal route | HiveHub route | Purpose |
|---|---|---|
| `GET /devices/:deviceId/insights` | `GET /devices/:id/insights` | Current alerts, optional `lookback_days` |
| `GET /devices/:deviceId/insights/summary` | `GET /devices/:id/insights/summary` | Summary |
| `GET /devices/:deviceId/insights/history` | `GET /devices/:id/insights/history` | Alert history; `status`, `category`, `since`, `limit` |

### Inspection mode

| HivePal route | HiveHub route | Purpose |
|---|---|---|
| `GET /devices/:deviceId/inspections/status` | `GET /devices/:id/inspections/status` | Pending/active state |
| `GET /devices/:deviceId/inspections` | `GET /devices/:id/inspections` | History; `start_at`, `end_at`, `limit` |
| `POST /devices/:deviceId/inspections/start` | `POST /devices/:id/inspections/start` | Start; optional `hives`, `note`, `started_at` |
| `POST /devices/:deviceId/inspections/stop` | `POST /devices/:id/inspections/stop` | Stop; optional `note`, `ended_at` |
| `PATCH /devices/:deviceId/inspections/:inspectionId` | `PATCH /devices/:id/inspections/:inspectionId` | Edit the note |

### Audio recordings

| HivePal route | HiveHub route | Purpose |
|---|---|---|
| `GET /devices/:deviceId/recordings` | `GET /devices/:id/recordings` | List; optional `hive`, `limit` |
| `POST /devices/:deviceId/recordings` | `POST /devices/:id/recordings` | Request a clip; query `hive`, `duration` (1–60 s), optional `gain_db` |
| `GET /recordings/:recordingId` | `GET /recordings/:id` | Recording metadata and quality figures |
| `GET /recordings/:recordingId/audio.wav` | `GET /recordings/:id/audio.wav` | Streamed WAV |
| `DELETE /recordings/:recordingId` | `DELETE /recordings/:id` | Delete |

### Firmware

| HivePal route | HiveHub route | Purpose |
|---|---|---|
| `POST /devices/:deviceId/firmware` | `POST /devices/:id/firmware` | Upload a release (multipart `file`, `version`, `target`, `board`, `active`) |
| `GET /devices/:deviceId/firmware/status` | `GET /devices/:id/firmware/status` | Hub update state; per-node relay status *(new HiveHub)* |
| `POST /devices/:deviceId/firmware/approve` | `POST /devices/:id/firmware/approve` | Approve the pending hub update |
| `POST /devices/:deviceId/commands/update-hiveinside` | `POST /devices/:id/commands/update-hiveinside` | Relay the active HiveInside release to one slot; `slot`, `force` |
| `POST /devices/:deviceId/commands/update-beecounter` | `POST /devices/:id/commands/update-beecounter` | Relay the active HiveTraffic release to one slot; `slot`, `force` |

Firmware upload details:

- `target` is `hivehub` (legacy `hivescale`), `hiveinside`, or `beecounter` (HiveTraffic); default `hivehub`. `board` is `esp32`, `esp32-c6`, `nrf54lm20a`, or empty to let HiveHub derive it from the filename. The frontend pre-selects both from the filename.
- After an **active** `hiveinside` upload, the backend queues the HiveInside relay for every slot that reports a HiveInside node and returns the per-slot result as `auto_queued_updates`.
- HiveHub refuses a relay that is not newer than the node's version with `409`; `force=true` ("Relay anyway" in the UI) overrides that.

---

## Measurement data

HiveHub returns a `hives` array on every measurement (`HiveScaleHiveReading`, indexes 1–18) with weight, raw weight, temperature, humidity, accelerometer bands, HiveInside audio metrics, HiveHeart data (incl. 16 spectrum bins), HiveScale node data, BLE node identity, and bee-counter values. For older rows HiveHub synthesizes hives 1–2 from the flat columns. The flat `scale_1_*`/`hive_1_*`/… fields remain as a 1–2 mirror; new UI code reads `hives`.

Hub-level fields include ambient temperature/humidity, battery (`battery_voltage_v`, `battery_soc_percent`, …), solar (`solar_load_voltage_v`, `solar_current_ma`, `solar_power_mw`), `network_transport`, `rssi_dbm`, `cellular_csq`, `time_source`, `boot_count`, `firmware_version`, and the inspection flags (`inspection`, `inspection_id`, `inspection_hives`).

---

## Frontend integration

### API hooks

`apps/frontend/src/api/hooks/useHiveScale.ts` calls only HivePal routes under `/api/hivescale/...`. Main hooks:

| Area | Hooks |
|---|---|
| Devices | `useHiveScaleDevices`, `useClaimHiveScaleDevice`, `useRemoveHiveScaleDevice`, `useReleaseHiveScaleDevice`, `useHiveScaleMembers`, `useShareHiveScaleDevice`, `useRevokeHiveScaleMember` |
| Config | `useHiveScaleDeviceConfig`, `useUpdateHiveScaleConfig`, `useFitHiveScaleTempCompensation`, `useUpdateHiveScaleChannels`, `useStartHiveScaleCalibrationMode`, `useStopHiveScaleCalibrationMode`, `useStartHiveScaleProvisioning` |
| Measurements | `useHiveScaleMeasurements` (refetch 60 s, 5 s while calibrating), `useImportHiveScaleSdData`, `useHiveScaleExportSummary`, `hiveScaleExportUrl`, `useDeleteHiveScaleMeasurements` |
| Insights | `useHiveScaleInsights`, `useHiveScaleInsightsSummary` (refetch 5 min), `useHiveScaleInsightsHistory` |
| Inspections | `useHiveScaleInspectionStatus` (refetch 30 s), `useHiveScaleInspections`, `useStartHiveScaleInspection`, `useStopHiveScaleInspection`, `useUpdateHiveScaleInspection` |
| Audio | `useHiveScaleRecordings`, `useRequestHiveScaleRecording`, `useDeleteHiveScaleRecording` |
| Firmware | `useUploadHiveScaleFirmware`, `useHiveScaleFirmwareStatus`, `useApproveHiveScaleFirmware`, `useQueueHiveInsideUpdate`, `useQueueBeeCounterUpdate` |

`hiveHubErrorMessage()` surfaces HiveHub's error message in toasts.

### HiveHub page

`apps/frontend/src/pages/hivescale/hivescale-page.tsx` (route `/hivescale`, sidebar "HiveHub") has five tabs:

| Tab | Components |
|---|---|
| Overview | `hivehub-hive-cards.tsx` (a card per reported hive: compensated weight, 24 h change, temperature, humidity, traffic, alerts, inspection badge), General card (ambient, power, wireless sensor batteries), `hivescale-modular-dashboard.tsx` |
| Inspections | `hivehub-inspection-card.tsx` |
| Audio | `hivehub-audio-panel.tsx` |
| Health | `hivehub-hub-status-card.tsx`, `hivehub-health-card.tsx` |
| Setup | claim, device status & sharing, `hivehub-alert-settings-card.tsx`, hive slots, `hivehub-calibration-card.tsx` (calibration wizard + temperature compensation), `hivehub-traffic-card.tsx`, `hivehub-hub-access-card.tsx` (remote setup AP, inspection timeout), `hivehub-firmware-card.tsx`, `hivehub-sd-import-card.tsx`, `hivehub-data-card.tsx` (export, range delete) |

Dashboard notes:

- Widgets include weight comparison, daily max weight, climate, power, bee traffic, sound RMS, vibration, HiveHeart spectrum, temperature heatmap, insights, data quality, and a configurable diagram. The layout is stored in `localStorage` per device (`hivepal:hivescale-dashboard:<deviceId>:v<n>`).
- Date ranges: presets (24 h, 7 d, 30 d, 365 d, current year, all) and a custom day range (`hivescale-date-range.ts`). When a range needs more than 2000 points (anything beyond about 7 days at the 5-minute cadence), the query adds `max_points=2000` so HiveHub down-samples server-side.
- HiveHub inspection windows are shaded on the charts; each chart has a CSV download.

### Hive slots and links

`hivehub-links.ts` reads `channels.names` and `channels.hive_ids` (slots 1–18) from the device list. Saving writes both to HiveHub via `PATCH /channels`. Names that older HivePal versions kept in `localStorage` (`hivepal:hivescale-hive-mapping:<deviceId>:v1`) are read as a fallback and removed after the next save.

A linked hive gets:

- a HiveHub card on the hive detail page (`pages/hive/hive-detail-page/hivehub-hive-card.tsx`) with weight, 24 h change, temperature, humidity, and a link to the HiveHub page;
- a prompt on the create/edit inspection pages and the mobile wizard (`hivehub-inspection-prompt.tsx`) offering to start or stop HiveHub inspection mode for that slot. It never starts inspection mode automatically.

---

## Alert emails

`hivehub-alert.scheduler.ts` runs every 15 minutes (HiveHub's insight reconciler refreshes on the same default interval). For each user with alerts enabled, `hivehub-alert.service.ts`:

1. signs a token for the user and lists their devices,
2. reads active alerts from `insights/history?status=active`,
3. selects alerts at or above the user's minimum severity that are new or have escalated past the severity last mailed (`hivehub-alert.rules.ts`),
4. sends one digest email per run (`MailService.sendHiveHubAlertEmail`, links built from `FRONTEND_URL`),
5. records what was mailed in `HiveHubAlertNotification` and deletes rows for alerts that are no longer active.

Alerts are HiveHub insight alerts (swarm, queenless, robbing, foraging, brood, decline/absconding, winter, harvest, acoustic). A recurrence gets a new HiveHub alert id and is mailed again.

Preferences are stored in the user's preferences as `hiveHubAlerts: { enabled, minSeverity }` (`watch` | `warning` | `critical`, default `warning`) and set in **Setup → HiveHub email alerts**. Users who had the retired `swarmAlert.enabled` preference keep alerts enabled.

The former HivePal weight-drop swarm alert job has been removed.

---

## SD card data import

HiveHub devices keep an append-only backup of every reading on their SD card (`measurements.ndjson`), plus a `cache.ndjson` retry queue. The beekeeper can download the card in AP mode as `hivescale-sd-data.tar` and upload it into HivePal to backfill offline periods.

### Data flow

```text
Hub SD card (measurements.ndjson + cache.ndjson)
  | AP-mode download (GET /sd/download-all)
  v
hivescale-sd-data.tar  (or an extracted .ndjson)
  | multipart upload, field "file" (+ optional "force")
  v
HivePal backend  (parse + device check + chunk + forward)
  | POST /api/v1/app/devices/:id/measurements/import
  v
HiveHub backend (idempotent bulk insert)
```

### Backend handling

| Concern | Location | Notes |
|---|---|---|
| HTTP endpoint | `hivescale.controller.ts` → `importSdMeasurements()` | Multipart `file` via `FileInterceptor`, capped by `HIVESCALE_SD_IMPORT_MAX_FILE_SIZE`; `400` for an empty upload. |
| File parsing | `sd-import.parser.ts` → `parseSdMeasurements()` | Detects `.tar` from the filename or the USTAR magic, extracts every `*.ndjson` member, parses line by line. Corrupt lines are counted as `skipped`. |
| Device check | `hivescale.service.ts` → `importSdMeasurements()` | If records carry a `device_id` other than the selected device, answers `409` with `code: "device_mismatch"` and `file_device_ids`; the frontend asks the user and retries with `force=true`. |
| Forwarding | `hivescale.service.ts` → `importSdMeasurements()` | Pins every record's `device_id` to the path device, forwards in chunks of 5000 (HiveHub caps a request at 20000), and sums the counts. |

Re-uploading is safe: HiveHub treats `(device_id, measured_at)` as the natural key and reports existing rows as duplicates.

The result (`HiveScaleSdImportResult`) has `parsed`, `skipped`, `received`, `inserted`, and `duplicates`.

Importing requires `owner` or `admin`. HiveHub re-checks the role and never auto-creates devices from uploaded data.

---

## Data export and range delete

- **Export** (`owner`/`admin`): the frontend fetches `export/measurements/summary` for the chosen range, then navigates to `hiveScaleExportUrl()` so the browser streams the NDJSON to disk. The backend passes HiveHub's stream and `Content-Disposition` through. Optional `hive` parameters limit it to selected slots. The file can be imported again.
- **Delete** (`owner` only): the frontend shows the export summary for the range as a preview, then sends `POST measurements/delete` with `start_at`, `end_at`, and the device's `claim_code`, which HiveHub checks before deleting.

---

## Device pairing flow

1. Flash the hub firmware with a `CLAIM_CODE` in `secrets.h`.
2. The device sends at least one measurement containing that claim code.
3. In HivePal, open **HiveHub → Setup** and submit the claim code.
4. The HivePal backend forwards `POST /devices/claim` with the service key and the user's token.
5. HiveHub hashes the claim code, matches the unclaimed device, and makes the user its owner.

---

## Roles

| Role | Claim | View data | Inspections, audio, config, names/links, firmware, import, export | Range delete, share/revoke |
|---|---:|---:|---:|---:|
| `owner` | Yes | Yes | Yes | Yes |
| `admin` | No | Yes | Yes | No |
| `viewer` | No | Yes | No | No |

HiveHub enforces these; the UI hides or disables controls to match.

---

## Un-pairing and re-pairing

| Step | What happens |
|---|---|
| Remove (or release) the device in HivePal | HiveHub clears `claimed_at` once no members remain, so the claim code works again. The response's `released` flag says whether that happened. |
| The device's next upload | HiveHub answers `"claimed": false`; firmware 0.24.9+ drops its local "claim registered" latch and sends its claim code again. Older firmware needs the setup-portal or factory-reset route below. |
| Claim the code in HivePal again | The device re-appears with its history, config, names, and links. |

On removal HivePal clears the browser-local state keyed by `device_id`: the dashboard layout and any legacy hive-name mapping.

**Older HiveHub backends** do not clear `claimed_at` on removal, leaving the device claimed with no members (`404` on the claim code). Upgrade HiveHub and run its `022_release_orphaned_devices.sql` migration once to release devices already stuck.

---

## Troubleshooting

### `500 HIVEHUB_API_BASE_URL (or legacy HIVESCALE_API_BASE_URL) is not configured`

Set `HIVEHUB_API_BASE_URL` in the HivePal backend environment and restart.

### `500 HIVEHUB_SERVICE_API_KEY (or legacy HIVESCALE_SERVICE_API_KEY) is not configured`

Set `HIVEHUB_SERVICE_API_KEY` and restart.

### `401 Invalid HivePal service key`

HivePal's `HIVEHUB_SERVICE_API_KEY` does not match HiveHub's `HIVEPAL_SERVICE_API_KEY`.

### `401 Invalid or expired token`

HiveHub could not verify the token HivePal signed. Check that HiveHub's `HIVEPAL_JWT_SECRET` equals HivePal's `JWT_SECRET`.

### `404` on export, delete, setup access point, or relay status

HiveHub is older than the version listed under [HiveHub version](#hivehub-version). Hive links saved against such a backend are silently dropped.

### `409` — the code belongs to an already-claimed device

The claim code is right, but the device is still paired. Its owner has to release it first. Older HiveHub backends report this as `404`.

### `404 No unclaimed device found for this claim code`

No device has sent that claim code: it has not uploaded yet, or the code is wrong.

If HiveHub was rebuilt from scratch and the device was claimed against a previous install, older firmware stops sending its claim code after the first successful claim. Fixes: (1) update to firmware that keeps sending the code until the server confirms the claim, (2) re-submit the claim code in the device's setup portal (join `HiveHub-Setup-XXXX`, save) — firmware 0.24.9+ then sends it again, (3) on old firmware, bump `CLAIM_CODE_REVISION` in `secrets.h` (or set `FORCE_RESEED true`) and re-flash, or (4) factory-reset. A plain re-flash with an unchanged `secrets.h` does not help, because the flag lives in NVS.

### No measurements in HivePal

Check the device's `last_seen_at`, HiveHub logs, ESP32 serial output, and whether the HivePal backend can reach `HIVEHUB_API_BASE_URL`.

### No alert emails

Check that the user enabled **HiveHub email alerts**, that the HivePal mail provider works, and the backend log for `HiveHub alert check failed` / `Could not read insights` warnings.

### Sharing by email fails

The email must belong to an existing HivePal user.

### SD import: "No measurements found in the uploaded file"

The parser found no valid NDJSON records. Confirm the file is `measurements.ndjson` or `hivescale-sd-data.tar` and not empty or truncated.

### SD import reports many duplicates

Expected when the device was online: those readings already reached HiveHub. Only offline readings count toward `inserted`.
