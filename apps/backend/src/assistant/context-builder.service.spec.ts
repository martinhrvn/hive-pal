import { ConfigService } from '@nestjs/config';
import {
  HiveDetailResponse,
  HiveResponse,
  InspectionResponse,
  InspectionStatus,
} from 'shared-schemas';
import {
  ContextBuilderService,
  ASSISTANT_ADVISORY_DISCLAIMER,
} from './context-builder.service';
import { HiveService } from '../hives/hive.service';
import { InspectionsService } from '../inspections/inspections.service';
import { CustomLoggerService } from '../logger/logger.service';

const makeInspection = (
  date: string,
  overallScore: number | null,
  overrides: Partial<InspectionResponse> = {},
): InspectionResponse =>
  ({
    id: `insp-${date}`,
    hiveId: 'hive-1',
    date,
    isAllDay: true,
    temperature: 22,
    weatherConditions: 'Sunny',
    notes: null,
    status: InspectionStatus.COMPLETED,
    observations: {
      strength: 7,
      reminderObservations: ['needs_super'],
    },
    actions: [],
    score:
      overallScore === null
        ? undefined
        : {
            overallScore,
            populationScore: 7,
            storesScore: 6,
            queenScore: 8,
            warnings: [],
            confidence: 1,
          },
    ...overrides,
  }) as unknown as InspectionResponse;

const hiveDetail: HiveDetailResponse = {
  id: 'hive-1',
  name: 'Alpha',
  apiaryId: 'apiary-1',
  status: 'ACTIVE',
  notes: 'Strong colony',
  installationDate: '2025-04-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  boxes: [
    {
      id: 'box-1',
      position: 0,
      frameCount: 10,
      maxFrameCount: 10,
      hasExcluder: false,
      type: 'BROOD',
      winterized: false,
    },
  ],
  hiveScore: {
    overallScore: 7,
    populationScore: 7,
    storesScore: 6,
    queenScore: 8,
    warnings: ['low_stores'],
    confidence: 1,
  },
  activeQueen: {
    id: 'queen-1',
    hiveId: 'hive-1',
    marking: 'blue',
    color: 'blue',
    year: 2025,
    status: 'ACTIVE',
    installedAt: '2025-04-01T00:00:00.000Z',
  },
  alerts: [
    {
      id: 'alert-1',
      hiveId: 'hive-1',
      type: 'feeding_required',
      message: 'Feeding required',
      severity: 'HIGH',
      status: 'ACTIVE',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    },
  ],
} as unknown as HiveDetailResponse;

describe('ContextBuilderService', () => {
  let service: ContextBuilderService;
  let hiveService: jest.Mocked<Pick<HiveService, 'findOne' | 'findAll'>>;
  let inspectionsService: jest.Mocked<Pick<InspectionsService, 'findAll'>>;
  let configValues: Record<string, unknown>;

  beforeEach(() => {
    configValues = {};
    hiveService = {
      findOne: jest.fn().mockResolvedValue(hiveDetail),
      findAll: jest.fn(),
    };
    inspectionsService = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    const config = {
      get: (key: string) => configValues[key],
    } as unknown as ConfigService;
    const logger = {
      setContext: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as CustomLoggerService;

    service = new ContextBuilderService(
      hiveService as unknown as HiveService,
      inspectionsService as unknown as InspectionsService,
      config,
      logger,
    );
  });

  it('includes the advisory disclaimer in every system message', async () => {
    const msg = await service.buildSystemMessage({
      kind: 'hive',
      apiaryId: 'apiary-1',
      hiveId: 'hive-1',
      userId: 'user-1',
    });
    expect(msg).toContain(ASSISTANT_ADVISORY_DISCLAIMER);
    expect(msg).toContain('NEVER invent');
  });

  it('includes structured-suggestion instructions for hive scope only', async () => {
    const hiveMsg = await service.buildSystemMessage({
      kind: 'hive',
      apiaryId: 'apiary-1',
      hiveId: 'hive-1',
      userId: 'user-1',
    });
    expect(hiveMsg).toContain('Optional structured suggestions');

    hiveService.findAll.mockResolvedValue([]);
    const apiaryMsg = await service.buildSystemMessage({
      kind: 'apiary',
      apiaryId: 'apiary-1',
      userId: 'user-1',
    });
    expect(apiaryMsg).not.toContain('Optional structured suggestions');
  });

  it('enforces ownership by scoping HiveService/InspectionsService queries', async () => {
    await service.buildHiveContext({
      apiaryId: 'apiary-1',
      hiveId: 'hive-1',
      userId: 'user-1',
    });
    expect(hiveService.findOne).toHaveBeenCalledWith('hive-1', {
      apiaryId: 'apiary-1',
      userId: 'user-1',
    });
    expect(inspectionsService.findAll).toHaveBeenCalledWith({
      apiaryId: 'apiary-1',
      userId: 'user-1',
      hiveId: 'hive-1',
    });
  });

  it('renders the full hive bundle for a per-hive scope', async () => {
    inspectionsService.findAll.mockResolvedValue([
      makeInspection('2026-05-01T00:00:00.000Z', 7),
    ]);
    const ctx = await service.buildHiveContext({
      apiaryId: 'apiary-1',
      hiveId: 'hive-1',
      userId: 'user-1',
    });
    expect(ctx).toContain('## Hive Overview');
    expect(ctx).toContain('Name: Alpha');
    expect(ctx).toContain('## Queen Information');
    expect(ctx).toContain('## Box Configuration');
    expect(ctx).toContain('## Health Scores');
    expect(ctx).toContain('## Active Alerts');
    expect(ctx).toContain('[HIGH] Feeding required');
    expect(ctx).toContain('## Recent Inspections');
    expect(ctx).toContain('Reminders: needs_super');
  });

  it('renders most recent N inspections verbatim and summarizes older ones', async () => {
    configValues['ASSISTANT_CONTEXT_RECENT_INSPECTIONS'] = 2;
    const inspections = [
      makeInspection('2026-05-05T00:00:00.000Z', 8),
      makeInspection('2026-04-05T00:00:00.000Z', 7),
      makeInspection('2026-03-05T00:00:00.000Z', 6),
      makeInspection('2026-02-05T00:00:00.000Z', 5),
    ];
    inspectionsService.findAll.mockResolvedValue(inspections);

    const ctx = await service.buildHiveContext({
      apiaryId: 'apiary-1',
      hiveId: 'hive-1',
      userId: 'user-1',
    });

    expect(ctx).toContain('## Recent Inspections (most recent 2)');
    expect(ctx).toContain('## Older Inspections (2, summarized)');
    // verbatim sections carry the "Scores:" detail line
    expect(ctx).toContain('overall=8');
    // older ones are one-liners
    expect(ctx).toContain('score 6/10');
  });

  it('excludes non-completed inspections', async () => {
    inspectionsService.findAll.mockResolvedValue([
      makeInspection('2026-05-01T00:00:00.000Z', 7, {
        status: InspectionStatus.SCHEDULED,
      }),
    ]);
    const ctx = await service.buildHiveContext({
      apiaryId: 'apiary-1',
      hiveId: 'hive-1',
      userId: 'user-1',
    });
    expect(ctx).toContain('No completed inspections recorded.');
  });

  it('builds a compact per-hive summary for an apiary scope', async () => {
    const hives: HiveResponse[] = [
      {
        id: 'hive-1',
        name: 'Alpha',
        status: 'ACTIVE',
        lastInspectionDate: '2026-05-01T00:00:00.000Z',
        lastInspectionOverallScore: 7,
        lastInspectionWarnings: ['low_stores'],
        alerts: [
          {
            id: 'a1',
            hiveId: 'hive-1',
            type: 'feeding_required',
            message: 'Feeding required',
            severity: 'HIGH',
            status: 'ACTIVE',
            createdAt: '2026-05-01T00:00:00.000Z',
            updatedAt: '2026-05-01T00:00:00.000Z',
          },
        ],
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
      {
        id: 'hive-2',
        name: 'Beta',
        status: 'ACTIVE',
        lastInspectionWarnings: [],
        alerts: [],
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ] as unknown as HiveResponse[];
    hiveService.findAll.mockResolvedValue(hives);

    const ctx = await service.buildApiaryContext({
      apiaryId: 'apiary-1',
      userId: 'user-1',
    });

    expect(hiveService.findAll).toHaveBeenCalledWith({
      apiaryId: 'apiary-1',
      userId: 'user-1',
    });
    expect(ctx).toContain('## Apiary Overview (2 active hives)');
    expect(ctx).toContain('### Alpha');
    expect(ctx).toContain('### Beta');
    expect(ctx).toContain('Last health score: 7/10');
    expect(ctx).toContain('[HIGH] Feeding required');
    expect(ctx).toContain('Open reminders/warnings: low_stores');
  });

  it('caps context to the configured max chars', async () => {
    configValues['ASSISTANT_CONTEXT_MAX_CHARS'] = 200;
    inspectionsService.findAll.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) =>
        makeInspection(`2026-0${(i % 9) + 1}-01T00:00:00.000Z`, (i % 10) + 1),
      ),
    );
    const msg = await service.buildSystemMessage({
      kind: 'hive',
      apiaryId: 'apiary-1',
      hiveId: 'hive-1',
      userId: 'user-1',
    });
    expect(msg).toContain('[...context truncated');
  });
});
