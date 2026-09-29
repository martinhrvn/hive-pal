# Hive Pal Checklist

## Hive Management

- [x] Create new hives with name and installation date
- [x] View list of all hives with status indicators
- [x] View detailed information for individual hives
- [ ] Update hive status (Active, Inactive, Dead)
- [ ] Delete hives (with confirmation)

## Inspection Management

- [x] Create new inspections for any hive
- [ ] Schedule future inspections with reminders
- [ ] View calendar of upcoming scheduled inspections
- [ ] Set recurring inspection patterns (weekly, bi-weekly, monthly)
- [x] Quick add observations with toggle buttons and rating scales:
  - [x] Queen seen (yes/no with notes)
  - [x] Brood rating (capped, uncapped)
  - [x] Honey stores
  - [x] Population strength
  - [ ] Disease/pest signs (yes/no with notes)
  - [x] Queen cells present (amount)
- [ ] Record actions taken:
  - [ ] Feeding (with notes)
  - [ ] Treatments applied
  - [ ] Equipment changes
  - [ ] Harvesting
- [x] View inspection timeline/feed for each hive
- [ ] Filter inspections by date range
- [ ] View scheduled inspections for all hives
- [x] View detailed inspection records

## Queen Management

- [x] Track current queen for each hive
- [x] Record queen details (marking color, year, source)
- [x] Log queen replacements with dates
- [ ] View queen history for a hive

## Equipment Tracking

- [ ] Add boxes to hives with position and type (brood, honey, feeder)
- [ ] Record frame count per box
- [ ] Track queen excluders between boxes
- [ ] View current hive configuration

## Weather Integration

- [x] Record weather conditions during inspections
- [x] Track temperature during inspections

## Mobile-Optimized Features

- [x] Streamlined data entry forms
- [x] Timeline view of inspection history
- [ ] Quick-add buttons for common actions
- [ ] Compact, single-column layouts for mobile


## HiveHub Integration

- [x] Proxy HiveHub backend routes through the HivePal backend
- [x] HiveHub page for claiming devices and viewing latest measurements
- [x] Name all 18 hive slots and link them to HivePal hives (stored in HiveHub)
- [x] Display off-grid telemetry (battery, solar, signal) on the General card and Health tab
- [x] Chart battery and solar telemetry when available
- [x] Calibration-mode controls against the HiveHub calibration routes
- [x] Inspection mode (start/stop, history, chart shading, prompt from HivePal inspections)
- [x] Replace the HivePal swarm alert with HiveHub insight alert emails
- [ ] Add user-facing screenshots to the HiveHub documentation
- [ ] Add alerts for low battery, missing solar monitor, and poor cellular signal
