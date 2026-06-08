import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { AlertsEventHandler } from './alerts.event-handler';
import { AlertsScheduler } from './alerts.scheduler';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { InspectionOverdueChecker } from './checkers';
import {
  HiveUpdatedEvent,
  InspectionCreatedEvent,
} from '../events/hive.events';

describe('Alerts Event System Integration', () => {
  let moduleRef: TestingModule;
  let eventEmitter: EventEmitter2;
  let _alertsEventHandler: AlertsEventHandler;
  let alertsScheduler: AlertsScheduler;
  let _prismaService: PrismaService;

  const mockPrismaService = {
    hive: {
      findFirst: vi.fn(),
    },
    alert: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const mockLoggerService = {
    setContext: vi.fn(),
    log: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        AlertsEventHandler,
        AlertsScheduler,
        AlertsService,
        InspectionOverdueChecker,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    // @OnEvent listeners are bound during onApplicationBootstrap, which only
    // runs on init() — without this, emitted events reach no handlers.
    await moduleRef.init();

    eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
    _alertsEventHandler = moduleRef.get<AlertsEventHandler>(AlertsEventHandler);
    alertsScheduler = moduleRef.get<AlertsScheduler>(AlertsScheduler);
    _prismaService = moduleRef.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('Event-driven alert checking', () => {
    it('should handle hive updated events', async () => {
      // Mock hive data
      const mockHive = {
        id: 'test-hive-id',
        name: 'Test Hive',
        status: 'ACTIVE',
        settings: { inspection: { frequencyDays: 7 } },
        inspections: [],
        apiary: { id: 'apiary-id', userId: 'user-id' },
      };

      mockPrismaService.hive.findFirst.mockResolvedValue(mockHive);
      mockPrismaService.alert.updateMany.mockResolvedValue({ count: 0 });

      // Spy on the checkSingleHive method
      const checkSingleHiveSpy = vi.spyOn(alertsScheduler, 'checkSingleHive');

      // Emit hive updated event
      const event = new HiveUpdatedEvent(
        'test-hive-id',
        'apiary-id',
        'user-id',
        'status',
      );
      await eventEmitter.emitAsync('hive.updated', event);

      // Wait a bit for async event handling
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that checkSingleHive was called
      expect(checkSingleHiveSpy).toHaveBeenCalledWith('test-hive-id');
    });

    it('should clear inspection alerts when inspection is created', async () => {
      // Mock active inspection alerts
      const mockAlerts = [
        { id: 'alert-1', type: 'inspection_overdue', status: 'ACTIVE' },
      ];

      mockPrismaService.alert.findMany.mockResolvedValue(mockAlerts);
      mockPrismaService.alert.updateMany.mockResolvedValue({ count: 1 });

      // Mock hive data
      const mockHive = {
        id: 'test-hive-id',
        name: 'Test Hive',
        status: 'ACTIVE',
        settings: { inspection: { frequencyDays: 7 } },
        inspections: [{ date: new Date() }],
        apiary: { id: 'apiary-id', userId: 'user-id' },
      };

      mockPrismaService.hive.findFirst.mockResolvedValue(mockHive);

      // Emit inspection created event
      const event = new InspectionCreatedEvent(
        'test-hive-id',
        'apiary-id',
        'user-id',
        'inspection-id',
        new Date(),
      );
      await eventEmitter.emitAsync('inspection.created', event);

      // Wait a bit for async event handling
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that inspection alerts were cleared
      expect(mockPrismaService.alert.updateMany).toHaveBeenCalledWith({
        where: {
          hiveId: 'test-hive-id',
          type: 'inspection_overdue',
          status: 'ACTIVE',
        },
        data: {
          status: 'RESOLVED',
          updatedAt: expect.any(Date) as Date,
        },
      });
    });
  });

  describe('Single hive alert checking', () => {
    it('should handle non-existent hive gracefully', async () => {
      mockPrismaService.hive.findFirst.mockResolvedValue(null);

      // AlertsScheduler logs via its own private Nest Logger, not the injected
      // CustomLoggerService, so spy on the Logger prototype.
      const warnSpy = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      await expect(
        alertsScheduler.checkSingleHive('non-existent-hive'),
      ).resolves.not.toThrow();

      expect(warnSpy).toHaveBeenCalledWith(
        'Hive non-existent-hive not found or not active',
      );

      warnSpy.mockRestore();
    });

    it('should resolve alerts when no issues found', async () => {
      // Mock hive with recent inspection (no alerts should be created)
      const mockHive = {
        id: 'test-hive-id',
        name: 'Test Hive',
        status: 'ACTIVE',
        settings: { inspection: { frequencyDays: 7 } },
        inspections: [{ date: new Date() }], // Recent inspection
        apiary: { id: 'apiary-id', userId: 'user-id' },
      };

      mockPrismaService.hive.findFirst.mockResolvedValue(mockHive);
      mockPrismaService.alert.updateMany.mockResolvedValue({ count: 2 });

      await alertsScheduler.checkSingleHive('test-hive-id');

      // Should resolve any active alerts since no issues were found
      expect(mockPrismaService.alert.updateMany).toHaveBeenCalledWith({
        where: {
          hiveId: 'test-hive-id',
          status: 'ACTIVE',
        },
        data: {
          status: 'RESOLVED',
          updatedAt: expect.any(Date) as Date,
        },
      });
    });
  });
});
