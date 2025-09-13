---
sidebar_position: 4
title: Inspections
---

# Hive Inspections

Record detailed hive inspections to track colony health, development, and management actions over time.

## Creating an Inspection

### Basic Information

**Hive Selection**
Select the hive you're inspecting from the dropdown menu. The list shows all active hives in your apiaries.

**Inspection Date**
Choose the date of your inspection. You can:
- Record past inspections
- Schedule future inspections (these appear in your calendar)
- Auto-populate weather data for past dates

## Weather Information

The inspection form automatically populates weather data when available for the selected date and apiary.

**Temperature**
- Automatically filled from stored weather data
- Can be manually adjusted if needed
- Displayed in your preferred units (°C or °F)

**Weather Conditions**
Choose from four condition types:
- ☀️ Sunny
- ⛅ Partly Cloudy
- ☁️ Cloudy
- 🌧️ Rainy

*Note: Weather auto-population only works for past dates where weather data has been recorded for the apiary.*

## Observations

Rate colony characteristics on a scale from 0-10, where 0 indicates absence/poor condition and 10 indicates excellent condition.

### Understanding the Rating System

The observation ratings are subjective evaluations based on your assessment of the hive. You can use whatever criteria you see fit for each rating - what constitutes a "10" for colony strength in your apiary may differ from another beekeeper's standards. The key purpose of these ratings is to track progression and changes over time, allowing you to identify trends in colony health and development. For this reason, it's important to maintain consistent rating criteria across all your inspections. Your personal rating scale will become more refined with experience, helping you quickly identify when a colony deviates from its normal patterns.

### Rating Fields

**Colony Strength** (0-10)
Overall vigor and population size of the colony

**Capped Brood** (0-10)
Amount of sealed/pupating brood

**Uncapped Brood** (0-10)
Amount of eggs and larvae

**Honey Stores** (0-10)
Quantity of stored honey

**Pollen Stores** (0-10)
Quantity of stored pollen/bee bread

**Queen Cells** (0-10)
Number of queen cells present

### Additional Observations

**Queen Seen** (checkbox)
Check if you visually confirmed the queen's presence

**Conditional Fields**
When Queen Cells rating > 0, two additional options appear:
- **Swarm Cells**: Indicates preparation for swarming
- **Supersedure Cells**: Indicates queen replacement

## Actions

Document management actions performed during the inspection.

### Feeding
Track supplemental feeding:
- Feed type (sugar syrup, pollen patty, etc.)
- Quantity and unit
- Concentration (for syrups)
- Notes

### Treatment
Record pest/disease treatments:
- Product used
- Amount applied
- Unit of measurement
- Application notes

### Frames
Document frame management:
- Number of frames added/removed
- Frame manipulation details
- Notes

### Note
Add action-specific observations or tasks:
- Custom action descriptions
- Important observations
- Follow-up reminders

## Notes

Add general inspection notes, observations, or reminders that don't fit into specific categories.

## Inspection Scoring System

Hive Pal automatically calculates inspection scores to help track colony health trends.

### Score Components

**Population Score**
Weighted average of:
- Colony Strength (weight: 2)
- Capped Brood (weight: 1)
- Uncapped Brood (weight: 1)

**Stores Score**
Weighted average of:
- Honey Stores (weight: 2)
- Pollen Stores (weight: 1)

**Queen Score**
Complex calculation including:
- Queen Cells (inverted: fewer is better, weight: 2)
- Capped Brood (weight: 2)
- Uncapped Brood (weight: 2)
- Swarm Cells (negative indicator, weight: 1)
- Supersedure Cells (negative indicator, weight: 1)
- Queen Seen (positive indicator, weight: 1)

**Overall Score**
Weighted combination:
- Population Score (weight: 2)
- Stores Score (weight: 1)
- Queen Score (weight: 1)

### Automatic Warnings

The system generates warnings for critical conditions:
- **No Brood**: Both capped and uncapped brood are 0
- **Swarm Preparation**: Queen cells present with swarm cells checked
- **Supersedure**: Queen cells present with supersedure cells checked

### Confidence Level

Indicates data completeness (0-100%):
- Based on how many score categories have data
- Higher confidence = more complete inspection data

## Saving Inspections

**Save Options**
- **Save**: Saves inspection as draft (can be edited later)
- **Save and Complete**: Marks inspection as completed
- **Scheduled Inspections**: Automatically marked as completed when saved

## Best Practices

1. **Consistency**: Use the same rating criteria across all inspections
2. **Timeliness**: Record inspections immediately while details are fresh
3. **Completeness**: Fill in as many observations as possible for better scoring accuracy
4. **Weather Tracking**: Ensure your apiary has weather integration for automatic data
5. **Action Documentation**: Record all management actions for complete hive history
6. **Regular Schedule**: Maintain consistent inspection intervals for trend analysis