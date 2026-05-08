# HiveScale Calibration Mode — HivePal User Guide

Calibration mode temporarily switches the scale from its normal battery-saving deep sleep to fast readings every few seconds. This makes it practical to capture an accurate empty-scale baseline and a known-weight reading within the same short session.

> **Who can use this?** Only users with the **owner** or **admin** role on a device can start, stop, or save calibration. Viewers can read measurements but cannot change calibration settings.

---

## Using the Calibration Wizard

The wizard is the recommended way to calibrate a scale. It walks you through the steps in order and saves the result automatically.

### Step 1 — Open the wizard

1. Go to the **HiveScale** page.
2. Expand the **Scale setup** panel.
3. In the **Calibration** card, click **Open calibration wizard**.

### Step 2 — Start fast mode

Click **Start fast mode** inside the wizard. The app queues a command for the device.

> The device only picks up commands when it wakes for its next normal measurement cycle (default every 10 minutes). The badge shows **Queued** until the device confirms it is active, then switches to **Active**. Once active, new raw readings arrive every few seconds.

### Step 3 — Select the scale to calibrate

Click **Scale 1** or **Scale 2** (shown with their display names). The wizard resets all captures when you switch scales.

### Step 4 — Capture the empty reading

1. Make sure nothing is resting on the scale.
2. Wait for at least one new fast reading to arrive (watch the timestamp in the wizard).
3. Click **Capture empty raw**.

The captured raw value and its timestamp are displayed in the **Empty scale** step panel.

### Step 5 — Capture the weighted reading

1. Enter the exact weight of your reference object in the **Weight / kg** field.
2. Place the reference weight on the scale.
3. Wait for at least one new fast reading after placing the weight.
4. Click **Capture weight raw**.

The wizard automatically calculates the calibration factor from the two captures:

```
offset = empty raw reading
factor = (loaded raw − empty raw) / known weight in kg
```

### Step 6 — Save and finish

Click **Save and stop fast mode**. The app:

- Saves the new offset and factor to the backend.
- Queues a stop command so the device returns to normal deep sleep on its next cycle.
- Closes the wizard.

If the calculated factor cannot be computed (e.g. the raw values did not change), an error alert appears. Check that the weight is on the correct scale and wait for another reading before trying again.

---

## Manual calibration (Advanced settings)

For fine-tuning or recovery without a reference weight session, expand **Advanced manual settings** inside the Calibration card.

- **Send interval seconds** — how often the device sends a measurement in normal (non-calibration) mode. Minimum 60 seconds.
- **Offset / empty raw reading** — the raw HX711 count when the scale is empty. Use the **Use latest** button to fill this field with the most recently received raw value.
- **Known weight / kg** — enter a reference weight and click **Calculate** to derive the factor from the current raw reading.
- **Factor / raw counts per kg** — can also be entered or adjusted directly.

Click **Save manual config** to apply. The config version counter increments with each save.

---

## Reading the status panel

The Calibration card always shows the current state:

| Badge | Meaning |
|---|---|
| **Off** | Device is in normal deep-sleep mode |
| **Queued** | A start or stop command has been sent; waiting for the device to wake up |
| **Active** | The device has confirmed calibration mode; fast readings are arriving |

The latest raw counts for both scales are shown below the badge and update automatically while active.

---

## Stopping calibration mode early

Click **Stop fast mode** inside the wizard at any time. The device returns to normal deep sleep on its next cycle. If you forget, calibration mode stops automatically after its timeout (default 10 minutes, maximum 30 minutes).
---

## Off-grid devices

Off-grid HiveScale devices may use SIM7080G cellular transport instead of Wi-Fi. Calibration still works the same way, but the command round-trip depends on the device's next wake cycle and cellular attach time.

For off-grid hardware, verify these status cards before starting a calibration session:

- **Battery state-of-charge** is high enough for repeated wake cycles.
- **Cellular status** is healthy and `cellular_csq` is reasonable at the installation site.
- **Solar/current telemetry** is present if you rely on the solar charger during long calibration sessions.

Keep calibration sessions short. Stop fast mode when finished so the device returns to normal deep sleep and modem shutdown behavior.
