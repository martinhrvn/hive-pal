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


## HiveScale Integration

- [x] Proxy HiveScale backend routes through the HivePal backend
- [x] Add HiveScale page for claiming devices and viewing latest measurements
- [x] Add scale channel naming for mapping Scale 1 / Scale 2 to hive names
- [x] Display off-grid telemetry fields from HiveScale measurements
- [x] Chart battery, solar, and cellular telemetry when available
- [ ] Verify HivePal calibration-mode controls against the deployed HiveScale backend routes
- [ ] Add user-facing screenshots to the HiveScale documentation
- [ ] Add explicit empty states for partially configured off-grid devices
- [ ] Add alerts for low battery, missing solar monitor, and poor cellular signal
- [ ] swarm alert integration
