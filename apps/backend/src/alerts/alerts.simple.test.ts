import {
  HiveUpdatedEvent,
  InspectionCreatedEvent,
  HiveCreatedEvent,
} from '../events/hive.events';

describe('Event Classes', () => {
  it('should create HiveUpdatedEvent correctly', () => {
    const event = new HiveUpdatedEvent(
      'hive-123',
      'apiary-456',
      'user-789',
      'status',
    );

    expect(event.hiveId).toBe('hive-123');
    expect(event.apiaryId).toBe('apiary-456');
    expect(event.userId).toBe('user-789');
    expect(event.updateType).toBe('status');
  });

  it('should create InspectionCreatedEvent correctly', () => {
    const date = new Date();
    const event = new InspectionCreatedEvent(
      'hive-123',
      'apiary-456',
      'user-789',
      'inspection-111',
      date,
    );

    expect(event.hiveId).toBe('hive-123');
    expect(event.apiaryId).toBe('apiary-456');
    expect(event.userId).toBe('user-789');
    expect(event.inspectionId).toBe('inspection-111');
    expect(event.inspectionDate).toBe(date);
  });

  it('should create HiveCreatedEvent correctly', () => {
    const event = new HiveCreatedEvent('hive-123', 'apiary-456', 'user-789');

    expect(event.hiveId).toBe('hive-123');
    expect(event.apiaryId).toBe('apiary-456');
    expect(event.userId).toBe('user-789');
  });
});
