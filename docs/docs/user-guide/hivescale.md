---
sidebar_position: 9
title: HiveHub Integration
description: Connect Hive-Pal with HiveHub (formerly HiveScale) hubs, claim devices, link hive slots to your hives, view live sensor data, run inspection mode, record audio, and receive alert emails.
keywords: [hivehub, hivescale, beehive scale, hive weight, hiveinside, hivetraffic, hiveheart, inspection mode, alerts, sd card, import, export, firmware]
---

# HiveHub Integration

Hive-Pal can connect to a self-hosted HiveHub backend (formerly HiveScale) to show live hive sensor data inside the Hive-Pal interface.

A HiveHub is an ESP32-based hub that collects readings from up to 18 hives: scale weight, in-hive temperature and humidity (HiveInside), entrance traffic (HiveTraffic), sound and vibration (HiveHeart), plus hub-level ambient, power and connectivity data. Hive-Pal does not store these readings itself; it shows what the HiveHub backend holds.

Open **HiveHub** from the sidebar (`/hivescale`).

---

## What you can do

- Claim a HiveHub device with its claim code and share it with other Hive-Pal users.
- Name each of the 18 hive slots and link it to a Hive-Pal hive.
- See per-hive cards and a configurable chart dashboard with any date range.
- Start and stop inspection mode so disturbances are marked and excluded from alerts.
- Record short audio clips from a hive's HiveInside node.
- Check hub and sensor health, calibrate scales, and manage firmware.
- Receive alert emails for HiveHub insight alerts (swarm, queenless, robbing, …).
- Import an SD card backup, export all readings, or delete a range of readings.

---

## Requirements

Your administrator or self-hosting setup must provide:

| Requirement | Description |
|---|---|
| HiveHub backend | A running HiveHub FastAPI service |
| HiveHub device | Hub firmware flashed with a claim code |
| Hive-Pal backend config | `HIVEHUB_API_BASE_URL` and `HIVEHUB_SERVICE_API_KEY` set (the legacy `HIVESCALE_*` names still work) |
| Matching service key | HiveHub's `HIVEPAL_SERVICE_API_KEY` must equal Hive-Pal's `HIVEHUB_SERVICE_API_KEY` |
| Shared JWT secret | HiveHub's `HIVEPAL_JWT_SECRET` must equal Hive-Pal's `JWT_SECRET` |

If HiveHub is not configured, the page shows a backend configuration error.

Some features need a recent HiveHub backend: linking hive slots to Hive-Pal hives, the remote setup access point, data export and range delete, and the per-node relay status in the firmware card. Against an older HiveHub these actions fail with a "Not Found" error (hive links are not saved); everything else works.

---

## Page layout

The page has five tabs. All but **Setup** need a selected device.

| Tab | Contents |
|---|---|
| **Overview** | Hive cards, the General card, and the chart dashboard |
| **Inspections** | Inspection mode and inspection history |
| **Audio** | Audio recordings from HiveInside nodes |
| **Health** | Hub status and sensor health |
| **Setup** | Claiming, sharing, alert emails, hive slots, calibration, hub settings, firmware, and data tools |

While inspection mode is active, a banner on the other tabs links back to **Inspections**.

---

## Claim a device

1. Make sure the device has already sent at least one measurement to the HiveHub backend.
2. Open **HiveHub → Setup**.
3. Enter the claim code in **Claim HiveHub device**.
4. Optionally enter a display name and names for hive 1 and hive 2. Other hives are named under **Hive slots** afterwards.
5. Select **Claim device**.

The device then appears in the device selector.

---

## Un-pair a device

Two buttons at the top of **Setup** do different things:

| Button | Effect |
|---|---|
| **Remove scale** | Removes *your* access. If you were the last person with access, the device is released and its claim code works again. If it is shared, the others keep it and it stays paired. |
| **Release device** (owners only) | Removes *everyone's* access and releases the device in one step, so it can be claimed again straight away. |

Readings, calibration, hive names and hive links are kept in HiveHub either way, so claiming the device again brings them back. Hive-Pal only forgets the dashboard layout saved in this browser.

The device notices on its next upload and starts offering its claim code again — no reflashing, no factory reset. This needs HiveHub firmware 0.24.9 or newer; on older firmware, re-enter the claim code in the device's setup portal or factory-reset it.

---

## Overview

### Hive cards

One card per hive the device reports (up to 18). Each shows:

- weight (temperature-compensated when compensation is on) and the change over the last 24 hours,
- hive temperature and humidity,
- entrance traffic from HiveTraffic,
- active alerts for that hive,
- a badge while the hive is in an inspection.

### General card

Ambient temperature and humidity, battery, solar input, and the battery level of wireless sensors.

### Dashboard

The dashboard is made of widgets you can add, remove, resize and rearrange. The layout is saved in your browser, per device. Available widgets include weight comparison, daily maximum weight, climate, power, bee traffic, sound level, vibration, HiveHeart spectrum, temperature heatmap, insights, data quality, and a configurable diagram.

- **Date range:** presets from 24 hours to all data, or a custom start and end day.
- **Inspection windows** from HiveHub inspection mode are shaded on the charts.
- **CSV:** each chart can download the data it shows.
- Ranges longer than 7 days are down-sampled by the server so charts stay fast.

Readings refresh every minute while the page is open.

---

## Inspection mode

Opening a hive makes the scale jump and the temperature drop. Inspection mode tells HiveHub that this is you, so the window is marked on the charts and does not raise alerts.

1. Open **HiveHub → Inspections**.
2. Select **Start**, choose the whole hub or the hives you are opening, and optionally add a note.
3. Confirm. The status shows **Pending** until the hub confirms, then **Active**.
4. Select **Stop** when you are done.

If you forget to stop, the hub ends inspection mode after the inspection timeout set under **Setup → Hub access**. The history lists past inspection windows; notes can be edited afterwards. Owners and admins can start and stop inspection mode.

### From a Hive-Pal inspection

When a Hive-Pal hive is linked to a hive slot (see [Hive slots](#hive-slots)), the create and edit inspection pages suggest starting HiveHub inspection mode for that hive. Hive-Pal never starts it automatically.

---

## Audio

On **Audio**, choose a hive with a HiveInside node and a length of 1–60 seconds, then request a recording. The hub records the next time it can and uploads a WAV file. For each recording you can play it, download it, see quality figures (length, dropped samples, gaps, hub buffer overruns, clipping, checksum), and delete it. Owners and admins can record and delete.

---

## Health

**Hub status** shows signal strength, network transport, time source, boot count, firmware, last check-in, battery and solar.

**Sensor health** lists the hub's own sensors and, per hive, the scale, the in-hive node (identity, firmware, battery), HiveTraffic counter diagnostics, and HiveHeart.

---

## Setup

### Device status and sharing

Shows your role, the device ID, the last measurement, and members. Owners can share the device with another Hive-Pal user by email (as admin or viewer) and revoke access. The recipient must already have a Hive-Pal account.

### Email alerts

Hive-Pal checks HiveHub's insight alerts every 15 minutes and emails you when an alert is new or has escalated. Alerts cover swarming, queenlessness, robbing, foraging, brood, colony decline or absconding, winter stores, harvest readiness, and acoustic signals.

- Off by default; switch it on in **HiveHub email alerts**. If you had the old Hive-Pal swarm alert enabled, this is already on.
- Choose the lowest severity to email: watch, warning (default), or critical.
- One run sends at most one email, listing every new alert across your devices.
- An alert you were already mailed about is not mailed again unless its severity rises.

### Hive slots

In the **Hives** card, each of the 18 slots on the device can get a name and a link to a Hive-Pal hive. Both are stored in HiveHub, so they are shared by every user of the device and appear in HiveHub's own dashboard and emails.

A linked hive shows a **HiveHub** card on its Hive-Pal hive page with its latest weight, 24-hour change, temperature and humidity, and a link to the HiveHub page. Owners and admins can edit slots.

### Calibration and temperature compensation

The calibration wizard and temperature compensation work for any hive 1–18. See the [calibration guide](https://github.com/martinhrvn/hive-pal/blob/main/apps/hivescale/hivescale-calibration.md) for the step-by-step flow.

### HiveTraffic

Night mode (a time window and traffic limit), the time zone used for it, and which emitter banks are enabled. At least one bank must stay on.

### Hub access

Starts the hub's setup access point remotely on its next check-in, so you can change Wi-Fi or download SD data without pressing the button. The inspection timeout is also set here.

### Firmware

- **Hub:** shows the running version and, when a newer build is available, an **Apply update** button. Hubs never update on their own.
- **HiveInside and HiveTraffic nodes:** per node, the running version and the status of the last relay. **Relay** pushes the active release to that node through the hub; **Relay anyway** sends it even when HiveHub thinks the node is already up to date.
- **Upload:** registers a new firmware binary. The target (hub, HiveInside, HiveTraffic) and board are detected from the filename and can be changed. Uploading an active HiveInside release queues the relay to every HiveInside node automatically.

Owners and admins can apply, relay, and upload.

### Import SD card data

Every hub keeps a backup of its readings on its SD card, even when it cannot reach the backend. To recover readings from an offline period:

1. Start the setup access point (with the device button, or remotely under **Hub access**). Join the `HiveHub-Setup-XXXX` network and open `http://192.168.4.1`.
2. Choose **Download all SD data (.tar)** to save `hivescale-sd-data.tar`.
3. In Hive-Pal, open **Setup → Import SD card data**, choose the `.tar` or an extracted `measurements.ndjson`, and upload it.

Hive-Pal reports how many new readings were imported and how many duplicates were skipped.

- **Re-uploading is safe.** Readings that already exist are skipped, so you can upload the whole backup each time.
- **Wrong device protection.** If the file was recorded by a different hub, Hive-Pal asks for confirmation before importing it into the selected device.
- **Owner or admin only.**

### Data export and cleanup

- **Export** (owners and admins) downloads the device's readings as an NDJSON backup, optionally limited to a date range and to selected hives. The file can be imported again.
- **Delete** (owners only) permanently removes the readings in a date range. You must enter the device's claim code to confirm.

---

## Roles

Roles are enforced by the HiveHub backend.

| Role | View readings | Inspections, audio, config, names, firmware, import, export | Delete readings, share device |
|---|---:|---:|---:|
| Owner | Yes | Yes | Yes |
| Admin | Yes | Yes | No |
| Viewer | Yes | No | No |

---

## Troubleshooting

### I cannot claim the device

The device must send a measurement with the claim code before Hive-Pal can claim it. Check the HiveHub backend logs and the ESP32 serial monitor.

If Hive-Pal says the device is **already claimed**, the code is right but the pairing still exists — ask its owner to use **Release device**, or remove it yourself if it is in your list.

If the device was removed a while ago and now cannot be claimed at all, the HiveHub backend may be an older version that left it claimed with nobody on it. Upgrading the backend fixes new removals; its `022_release_orphaned_devices.sql` migration releases the ones already stuck.

### The page shows no measurements

Check that the device has a recent last-seen time on **Health** and that the HiveHub backend is reachable from the Hive-Pal backend.

### A feature says it needs a newer HiveHub

Hive links, the remote setup access point, export and delete, and relay status need the updated HiveHub backend. Ask your administrator to upgrade it.

### I get no alert emails

Check that **HiveHub email alerts** is on, that the severity threshold is not higher than the alerts you expect, and that the Hive-Pal server has email configured.

### SD import says no measurements were found

Make sure you uploaded the HiveHub backup — the `hivescale-sd-data.tar` download or an extracted `measurements.ndjson` — and not another file. An empty or truncated download can also cause this; download the SD data again.

### Cellular status is poor

Check antenna position, SIM/APN settings, modem power stability, and whether the device can attach to LTE-M/NB-IoT at the installation site.
