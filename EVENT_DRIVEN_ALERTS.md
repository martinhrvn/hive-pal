# Event-Driven Alert System

## Overview

The event-driven alert system has been successfully implemented to provide real-time alert clearing when hives are updated or inspections are created. This eliminates the need to wait until the next scheduled check (2 AM) for alerts to clear.

## How It Works

### Events

Three event types are emitted when relevant actions occur:

1. **`HiveCreatedEvent`** - When a new hive is created
2. **`HiveUpdatedEvent`** - When hive details, status, settings, or boxes are modified  
3. **`InspectionCreatedEvent`** - When a new inspection is added to a hive

### Event Flow

```
1. User action (create hive, update hive, add inspection)
   ↓
2. Service method executes database operation
   ↓  
3. Event is emitted with hive/apiary/user details
   ↓
4. AlertsEventHandler receives the event
   ↓
5. Handler triggers real-time alert check for affected hive
   ↓
6. Alerts are created, updated, or resolved immediately
```

### Key Components

#### Event Classes (`src/events/hive.events.ts`)
- Define the structure of events with hive ID, apiary ID, and user ID
- Provide type safety for event data

#### Event Emission (Services)
- **HiveService**: Emits events on hive creation, updates, and box changes
- **InspectionsService**: Emits events when inspections are created

#### Event Handler (`src/alerts/alerts.event-handler.ts`)
- Listens for events using `@OnEvent()` decorators
- Triggers targeted alert checks for specific hives
- Automatically clears inspection-related alerts when new inspections are created

#### Enhanced AlertsScheduler
- Added `checkSingleHive()` method for event-driven checks
- Automatically resolves alerts when no issues are found
- Maintains existing scheduled checks as fallback

## Benefits

### ✅ Immediate Feedback
- Alerts clear as soon as the underlying issue is resolved
- Users see real-time status updates in the UI

### ✅ Reduced Database Load
- Only checks affected hives instead of all hives
- More efficient than full scheduled scans

### ✅ Better User Experience  
- No more waiting until 2 AM for resolved alerts to clear
- Immediate validation that actions resolved issues

### ✅ Maintainable Architecture
- Uses standard NestJS event patterns
- Keeps existing scheduled checks as backup
- Easy to add new event types and handlers

## Implementation Details

### Database Operations
- Events are emitted after successful database operations
- Alert resolution happens in separate transactions
- Fallback to scheduled checks ensures reliability

### Error Handling
- Event handlers catch and log errors without breaking operations
- Failed event handling doesn't affect main operations
- Graceful degradation to scheduled checks

### Testing
- Unit tests verify event class structure
- Integration tests validate end-to-end flow
- Mocked services for isolated testing

## Usage Examples

### Scenario 1: Overdue Inspection Alert
1. Hive has been flagged as "inspection overdue" 
2. User creates new inspection
3. `InspectionCreatedEvent` is emitted
4. Handler immediately clears the overdue alert
5. User sees alert disappear in real-time

### Scenario 2: Hive Settings Update
1. User changes hive inspection frequency from 7 to 14 days
2. `HiveUpdatedEvent` is emitted with type `settings`
3. Handler re-checks hive with new frequency
4. Alert severity may change or resolve entirely

### Scenario 3: Box Configuration Change
1. User adds honey super to hive
2. `HiveUpdatedEvent` is emitted with type `boxes`
3. Handler re-evaluates hive status
4. Any capacity-related alerts are updated

## Backward Compatibility

The scheduled alert check at 2 AM continues to run as a safety net, ensuring:
- Alerts are still checked even if events fail
- System remains reliable during event system issues
- Gradual migration path for future enhancements

## Future Enhancements

- Add more event types (queen updates, harvest events)
- Implement event replay for system recovery
- Add metrics for event-driven vs scheduled alert resolution
- Consider real-time WebSocket notifications to frontend