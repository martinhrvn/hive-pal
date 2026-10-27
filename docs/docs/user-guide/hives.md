---
sidebar_position: 3
title: Hive Management
description: Track hive status, configuration, and colony health with Hive-Pal's comprehensive hive management tools.
keywords:
  [hive management, bee colony tracking, hive status, beehive monitoring]
---

# Hive Management

Manage your hives with comprehensive tools for tracking status, configuration, and colony health. Each hive provides detailed insights and management capabilities.

## Video Tutorial

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <div style={{padding: '1rem', background: '#f0f0f0', borderRadius: '8px'}}>
    [Video: Hive Management - Coming Soon]
  </div>
</div>

## Overview Tab

### Main Display

The overview tab presents key information at a glance:

- **Hive Score**: Overall health and performance rating (explained in inspection documentation)
- **Queen Status**: Current queen information if present
- **Feeding Details**: Active feeding programs and schedules
- **Colony Strength**: Current population estimate
- **Last Inspection**: Date and key findings

![Hive Overview Screen](/img/screenshots/hive/overview.png)

### Activity Timeline

Track all hive events in chronological order:

- **Event Types**: Inspections, treatments, feeding, queen events, harvests
- **Filtering Options**:
  - Filter by event type
  - Date range selection
  - Search within notes
- **Quick Actions**:
  - Add note directly to timeline
  - Create new action item
  - Mark events as important

![Activity Timeline](/img/screenshots/hive/timeline.png)

### Right Side Panel

Quick access to important information and actions:

#### Active Alerts

- Overdue inspections
- Treatment reminders
- Feeding schedules
- Queen issues
- Disease warnings

#### Weather Widget

- Current conditions at hive location
- 7-day forecast
- Temperature trends
- Precipitation alerts
- Foraging conditions

#### Quick Actions

- **Add Inspection**: Quick entry form
- **Schedule Inspection**: Set future date
- **Add Queen**: Link or create queen record
- **Edit Hive**: Modify hive details
- **Print QR Code**: Generate hive label with link
- **Remove Hive**: Archive or delete

## Analytics Tab

### Performance Graphs

Visualize hive metrics over time:

#### Hive Score Tracking

- Score trends with configurable time periods
- 24 hours, 7 days, 30 days, 90 days, 1 year
- Compare with apiary average
- Identify patterns and anomalies

#### Additional Metrics

- Population estimates
- Honey production
- Varroa levels
- Treatment effectiveness
- Queen performance

![Analytics Dashboard](/img/screenshots/hive/analytics.png)

## Box Configurator Tab

### Visual Box Management

Configure your hive's physical structure:

#### Box Setup

- **Add/Remove Boxes**: Build your hive stack
- **Box Types**:
  - Brood box
  - Honey super
  - Feeder
  - Other specialized equipment
- **Frame Configuration**: Set frame count per box (8, 10, custom)
- **Color Coding**: Assign colors for visual identification
- **Drag to Reorder**: Arrange boxes to match physical setup

#### Box Details

- Track box age and condition
- Note foundation type
- Monitor comb status
- Schedule maintenance

![Box Configurator](/img/screenshots/hive/box-config.png)

## Settings Tab

### Hive Configuration

Customize hive-specific settings:

#### Basic Settings

- **Hive Name/Number**: Unique identifier
- **Location**: Position within apiary
- **Type**: Langstroth, Top Bar, Warre, etc.
- **Status**: Active, inactive, combining, etc.

#### Inspection Schedule

- **Base frequency**: The interval used outside seasons (default 7 days)
- **Season overrides**: A season can set its own inspection interval; the calendar and overdue alerts follow it
- **Calendar feed**: Include the hive's scheduled inspections in the iCal subscription

#### Seasons

Seasons replace the old fixed autumn feeding window. They are defined once per apiary
(**Apiary → Seasons**) and inherited by every hive:

- **Name**: e.g. Spring build-up, Late summer, Winter prep
- **Start / end**: Month and day; seasons may wrap the year (e.g. Nov 15 – Feb 28)
- **Inspection override**: Optional interval in days; empty means the hive's base interval
- **Feeding season**: Tick it and set a target in kg of sugar. Feeding progress is tracked
  against that target inside the season's window, so you can split feeding across
  several seasons.

A hive inherits the apiary template until you press **Customise for this hive** on its
Settings tab. Customised seasons are a full copy you can edit, including dates; **Use
apiary seasons** returns the hive to the template. Hives that still have the old autumn
feeding setting show it as one feeding season and convert it the next time the settings
are saved.

#### Legacy settings

- **Autumn feeding window**: Shown as a feeding season until converted; no data is lost
- **Old fixed schedule**: Hives with no seasons anywhere fall back to the built-in
  Aug 1 – Oct 31, 12 kg feeding season

#### Advanced Settings

- **Disease Monitoring**: Thresholds and alerts
- **Queen Tracking**: Marking system and replacement schedule
- **Production Goals**: Honey targets and tracking
- **Notes Template**: Default inspection form fields

![Settings Panel](/img/screenshots/hive/settings.png)

- **Consistent Naming**: Use systematic identifiers
- **Regular Updates**: Keep status current
- **Complete Profiles**: Fill all relevant fields
- **Photo Documentation**: Visual progress tracking
- **Timely Inspections**: Follow your schedule

## Related Features

- [Inspections](./inspections) - Record detailed observations
- [Queen Management](./queens) - Track queen lineage
- [Harvest Tracking](./harvest) - Monitor production
- [Equipment Management](./equipment) - Manage resources
