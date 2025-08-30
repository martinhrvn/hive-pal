export class HiveUpdatedEvent {
  constructor(
    public readonly hiveId: string,
    public readonly apiaryId: string,
    public readonly userId: string,
    public readonly updateType: 'status' | 'settings' | 'boxes' | 'general',
  ) {}
}

export class InspectionCreatedEvent {
  constructor(
    public readonly hiveId: string,
    public readonly apiaryId: string,
    public readonly userId: string,
    public readonly inspectionId: string,
    public readonly inspectionDate: Date,
  ) {}
}

export class HiveCreatedEvent {
  constructor(
    public readonly hiveId: string,
    public readonly apiaryId: string,
    public readonly userId: string,
  ) {}
}
