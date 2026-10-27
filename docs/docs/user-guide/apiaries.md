---
sidebar_position: 2
title: Apiary Management
description: Learn how to create, manage, and switch between apiaries in Hive-Pal. Apiaries are the main organizational context for all your beekeeping data.
keywords:
  [apiary management, beekeeping locations, apiary tracker, manage bee yards]
---

# Apiary Management

An apiary is your main context in Hive-Pal. All data displayed throughout the application is for your currently selected apiary.

## Video Tutorial

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <div style={{padding: '1rem', background: '#f0f0f0', borderRadius: '8px'}}>
    [Video: Apiary Management - Coming Soon]
  </div>
</div>

## Understanding Apiaries

### Context Switching

Apiaries serve as the main organizational context in Hive-Pal. When you select an apiary, all displayed information (hives, inspections, tasks, etc.) relates to that specific location.

![Apiary Dropdown in Sidebar](/img/screenshots/apiary/sidebar-dropdown.png)

### Switching Between Apiaries

- Use the apiary dropdown in the top-left sidebar
- Click to see all your apiaries
- Select different apiary to switch context
- All dashboard data updates automatically

## Creating an Apiary

To create a new apiary, you need:

### Required Information

- **Name**: Descriptive name for the location (e.g., "Home Garden", "Johnson Farm")
- **Location Description**: Brief description of the site
- **GPS Coordinates**: Latitude and longitude for weather integration

### Creation Steps

1. Click the **"+"** button or use FAB menu
2. Select **"New Apiary"**
3. Fill in the required fields:
   - Enter apiary name
   - Add location description
   - Set GPS coordinates (click on map or enter manually)
4. Click **"Save"**

![Apiary Creation Form](/img/screenshots/apiary/creation-form.png)

## Hive Layout Grid

### Dashboard Display

The top section of your dashboard shows a visual grid layout of all hives in the current apiary. This provides an at-a-glance view of your hive arrangement.

![Dashboard Hive Grid Layout](/img/screenshots/apiary/dashboard-grid.png)

### Configuring Layout

1. Navigate to apiary details
2. Click **"Hives"**
3. Drag and position hives in the grid
4. The grid adjusts to the number of hives in row/column
5. Layout saves automatically

![Grid Configuration Interface](/img/screenshots/apiary/grid-configuration.png)

### Grid Benefits

- Visual representation of physical hive placement
- Quick status overview of all hives
- Easy identification of hive locations
- Matches your actual apiary layout

## Managing Apiaries

### Editing Apiary Details

- Click edit button on apiary details page
- Update name, description, or coordinates
- Changes apply immediately

### Seasons

Owners can open the **Seasons** tab on the apiary to define the shared schedule for its
hives. A strip at the top shows the whole year: each season as a coloured segment and
the days in between as **Year-round**. Tap a segment for a summary of its inspection
interval and feeding target.

- **Year-round** sets the inspection interval for every day no season covers. Leave it
  empty to let each hive keep its own interval.
- Add a season with a name, start/end month and day, an optional inspection interval,
  and (optionally) a feeding target in kg of sugar. Turn **Inspections** off for a
  season with no inspections at all, such as winter: nothing is scheduled or overdue
  until it ends.
- Saved seasons show as one-line summaries; use the pencil to edit one.
- Seasons must not overlap; a date can only belong to one season.
- Hives inherit the year-round interval and the seasons together, as one schedule. They
  keep following it when it changes, unless they customise their own on the hive's
  Settings tab.
- **Apply to all hives** copies the saved schedule into every hive in the apiary. It
  replaces hive-specific seasons, year-round intervals and the old autumn feeding
  settings, so it asks for confirmation first.

If no template is saved, hives fall back to the built-in autumn feeding season
(Aug 1 – Oct 31, 12 kg) and their own base inspection interval.

### Deleting an Apiary

> **Warning**: Deleting an apiary removes all associated hives and data

1. Navigate to apiary settings
2. Click **"Delete Apiary"**
3. Confirm deletion by typing apiary name

## Best Practices

- Use descriptive names that identify the location clearly
- Keep GPS coordinates accurate for weather data
- Set up the grid layout to match your physical arrangement
- Switch contexts using the sidebar dropdown, not by navigating between pages
