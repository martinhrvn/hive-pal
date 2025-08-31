import { Test, TestingModule } from '@nestjs/testing';
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
  let eventEmitter: EventEmitter2;
  let alertsEventHandler: AlertsEventHandler;
  let alertsScheduler: AlertsScheduler;
  let prismaService: PrismaService;

  const mockPrismaService = {
    hive: {
      findFirst: jest.fn(),
    },
    alert: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    alertsEventHandler = module.get<AlertsEventHandler>(AlertsEventHandler);
    alertsScheduler = module.get<AlertsScheduler>(AlertsScheduler);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
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
      const checkSingleHiveSpy = jest.spyOn(alertsScheduler, 'checkSingleHive');

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
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('Single hive alert checking', () => {
    it('should handle non-existent hive gracefully', async () => {
      mockPrismaService.hive.findFirst.mockResolvedValue(null);

      await expect(
        alertsScheduler.checkSingleHive('non-existent-hive'),
      ).resolves.not.toThrow();

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Hive non-existent-hive not found or not active',
      );
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
          updatedAt: expect.any(Date),
        },
      });
    });
  });
});
