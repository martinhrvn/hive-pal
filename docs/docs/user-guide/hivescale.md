---
sidebar_position: 9
title: HiveScale Integration
description: Connect Hive-Pal with HiveScale beehive scales, claim devices, view live weight data, and monitor off-grid telemetry.
keywords: [hivescale, beehive scale, hive weight, off-grid, cellular, solar, battery, sd card, import, backup]
---

# HiveScale Integration

Hive-Pal can connect to a self-hosted HiveScale backend to show live beehive scale data inside the Hive-Pal interface.

HiveScale devices are ESP32-based dual hive scales. They can report weights, hive temperatures, ambient conditions, sensor health, and optional off-grid telemetry such as battery state, solar current, and SIM7080G cellular signal.

---

## What you can do

- Claim a HiveScale device with a pairing code.
- View the latest weight for scale 1 and scale 2.
- View hive and ambient temperature readings.
- Rename scale channels to match your Hive-Pal hive names.
- View historical charts for weight and temperature.
- Overlay inspection events on HiveScale charts.
- Manage device sharing with other Hive-Pal users.
- Adjust send interval and calibration settings when you have permission.
- Monitor off-grid status for battery, solar, and cellular-enabled devices.
- Import an SD card backup downloaded from the scale to recover offline readings.

---

## Requirements

Your administrator or self-hosting setup must provide:

| Requirement | Description |
|---|---|
| HiveScale backend | A running HiveScale FastAPI service |
| HiveScale device | ESP32 scale firmware flashed with a claim code |
| Hive-Pal backend config | `HIVESCALE_API_BASE_URL` and `HIVESCALE_SERVICE_API_KEY` set |
| Matching HiveScale service key | HiveScale must use the same key as `HIVEPAL_SERVICE_API_KEY` |
| Shared JWT secret | HiveScale must trust the same `JWT_SECRET` as Hive-Pal so it can validate forwarded user tokens |

If HiveScale is not configured, the HiveScale page may show backend configuration errors.

---

## Claim a device

1. Make sure the physical HiveScale device has already sent at least one measurement to the HiveScale backend.
2. Open **HiveScale** from the main navigation.
3. Enter the device claim code.
4. Optionally enter a display name and names for scale 1 and scale 2.
5. Submit the form.

After claiming, the device appears in the device selector and starts showing latest measurements.

---

## Readings and status cards

The HiveScale page shows the latest measurement from the selected device.

### Core readings

| Card | Source field |
|---|---|
| Scale 1 weight | `scale_1_weight_kg` |
| Scale 2 weight | `scale_2_weight_kg` |
| Hive 1 temperature | `hive_1_temp_c` |
| Hive 2 temperature | `hive_2_temp_c` |
| Ambient temperature | `ambient_temp_c` |
| Ambient humidity | `ambient_humidity_percent` |
| Firmware/config status | `firmware_version`, `config_version` |
| Sensor status | `sd_ok`, `rtc_ok`, `sht_ok` |

### Off-grid readings

Off-grid cards appear when the HiveScale firmware sends the optional fields.

| Card | Source fields |
|---|---|
| Battery voltage | `battery_voltage_v` or `battery_voltage` |
| Battery state of charge | `battery_soc_percent` |
| Battery alert | `battery_alert` |
| Battery monitor status | `battery_monitor_ok` |
| Solar/load voltage | `solar_load_voltage_v` |
| Solar current | `solar_current_ma` |
| Solar power | `solar_power_mw` |
| Solar monitor status | `solar_monitor_ok` |
| Network transport | `network_transport` |
| Cellular status | `cellular_ok` |
| Cellular signal quality | `cellular_csq` |

---

## Charts

The chart panel supports preset and custom ranges. Use it to compare weight changes, temperature patterns, battery charge, solar input, and cellular signal over time.

Inspection events from Hive-Pal are shown as markers so you can correlate hive interventions with weight changes.

---

## Scale channel names

Scale 1 and scale 2 can be renamed to match your Hive-Pal hive names. Owners and admins can edit these names. Viewers can see the names but cannot change them.

Recommended naming examples:

- `Hive A - left scale`
- `Hive B - right scale`
- `Back garden Buckfast`
- `Apiary 2 Carnica`

---

## Calibration mode

Calibration mode temporarily switches the scale from normal battery-saving sleep to fast readings. This is useful when you need immediate feedback while taring or applying a known weight.

Typical workflow:

1. Start calibration mode.
2. Remove weight from the platform and tare the target channel.
3. Place a known weight on the platform.
4. Apply the calibration value.
5. Stop calibration mode so the device returns to its normal send interval and deep-sleep behavior.

Calibration controls require owner or admin access.

---

## Import SD card data

Every HiveScale device keeps a backup of its readings on its SD card, even
when it cannot reach the backend. If your scale has been offline or off-grid
for a while, you can recover those missing readings by downloading them from
the device and uploading them into Hive-Pal.

### 1. Download the backup from the scale

Put the device into AP (setup) mode and download its SD data:

1. Press the device's setup button to start AP mode (a `HiveScale-Setup-XXXX`
   Wi-Fi network appears).
2. Connect to that network and open `http://192.168.4.1`.
3. Choose **Download all SD data (.tar)** to save `hivescale-sd-data.tar`.

See the HiveScale firmware documentation for the full AP-mode procedure,
including how to enter setup mode while the device is in deep sleep.

### 2. Upload it into Hive-Pal

1. Open **HiveScale** and select the claimed device.
2. Find the **Import SD card data** card.
3. Choose the file you downloaded — either the `hivescale-sd-data.tar` archive
   or an extracted `measurements.ndjson` file.
4. Select **Upload SD data**.

Hive-Pal reads the readings out of the file and adds them to the device's
history. After it finishes you'll see how many new readings were imported and
how many duplicates were skipped.

### Good to know

- **Re-uploading is safe.** Hive-Pal recognises readings it already has, so
  uploading the same file twice will not create duplicates — it simply reports
  them as skipped.
- **Duplicates are normal.** When the device was online, those readings already
  reached the backend, so only the offline gaps are added.
- **Owner or admin only.** Viewers can see the card but cannot import.
- **No need to prune the file.** You can upload the entire backup each time;
  only genuinely new readings are stored.

---

## Sharing and roles

HiveScale roles are enforced by the HiveScale backend.

| Role | View readings | Edit config and names | Share device |
|---|---:|---:|---:|
| Owner | Yes | Yes | Yes |
| Admin | Yes | Yes | No |
| Viewer | Yes | No | No |

Owners can share a HiveScale device with another Hive-Pal user by email address. The recipient must already have a Hive-Pal account.

---

## Troubleshooting

### I cannot claim the device

The device must send a measurement with the claim code before Hive-Pal can claim it. Check the HiveScale backend logs and the ESP32 serial monitor.

### The page shows no measurements

Verify that the selected device has a recent `last_seen_at` timestamp and that the HiveScale backend is reachable from the Hive-Pal backend.

### Off-grid cards are blank

The firmware may not be built with `ENABLE_INA219_SOLAR`, `ENABLE_MAX17048_BATTERY`, or `ENABLE_SIM7080G`, or the connected HiveScale backend may not be returning those fields.

### SD import says no measurements were found

Make sure you uploaded the HiveScale backup file — the `hivescale-sd-data.tar`
download or an extracted `measurements.ndjson` — and not another file. An empty
or truncated download can also cause this. Try downloading the SD data from the
device again.

### Cellular status is poor

Check antenna position, SIM/APN settings, modem power stability, and whether the device can attach to LTE-M/NB-IoT at the installation site.
