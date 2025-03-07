import { Test, TestingModule } from '@nestjs/testing';
import { InspectionsService } from './inspections.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { CreateObservationDto } from './dto/create-observation.dto';

describe('InspectionsService', () => {
  let service: InspectionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    inspection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InspectionsService>(InspectionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create inspection without observations', async () => {
      // Arrange
      const createInspectionDto: CreateInspectionDto = {
        hiveId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2025-03-01'),
        temperature: 25.5,
        weatherConditions: 'Sunny',
      };

      const expectedResult = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        ...createInspectionDto,
        observations: [],
      };

      mockPrismaService.inspection.create.mockResolvedValue(expectedResult);

      // Act
      const result = await service.create(createInspectionDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.inspection.create).toHaveBeenCalledWith({
        data: createInspectionDto,
        include: {
          observations: true,
        },
      });
    });

    it('should create inspection with observations', async () => {
      // Arrange
      const observations: CreateObservationDto[] = [
        {
          type: 'BROOD_PATTERN',
          numericValue: 4,
          notes: 'Good pattern',
        },
        {
          type: 'QUEEN_SEEN',
          numericValue: 1,
          notes: 'Marked queen spotted',
        },
      ];

      const createInspectionDto: CreateInspectionDto = {
        hiveId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2025-03-01'),
        temperature: 25.5,
        weatherConditions: 'Sunny',
        observations,
      };

      const expectedResult = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        hiveId: createInspectionDto.hiveId,
        date: createInspectionDto.date,
        temperature: createInspectionDto.temperature,
        weatherConditions: createInspectionDto.weatherConditions,
        observations: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            inspectionId: '123e4567-e89b-12d3-a456-426614174001',
            ...observations[0],
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            inspectionId: '123e4567-e89b-12d3-a456-426614174001',
            ...observations[1],
          },
        ],
      };

      mockPrismaService.inspection.create.mockResolvedValue(expectedResult);

      // Act
      const result = await service.create(createInspectionDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.inspection.create).toHaveBeenCalledWith({
        data: {
          hiveId: createInspectionDto.hiveId,
          date: createInspectionDto.date,
          temperature: createInspectionDto.temperature,
          weatherConditions: createInspectionDto.weatherConditions,
          observations: {
            create: observations.map((obs) => ({
              type: obs.type,
              numericValue: obs.numericValue,
              textValue: obs.textValue,
              notes: obs.notes,
            })),
          },
        },
        include: {
          observations: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should find one inspection with observations included', async () => {
      // Arrange
      const inspectionId = '123e4567-e89b-12d3-a456-426614174001';
      const expectedInspection = {
        id: inspectionId,
        hiveId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2025-03-01'),
        temperature: 25.5,
        weatherConditions: 'Sunny',
        observations: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            inspectionId: inspectionId,
            type: 'BROOD_PATTERN',
            numericValue: 4,
            textValue: null,
            notes: 'Good pattern',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            inspectionId: inspectionId,
            type: 'QUEEN_SEEN',
            numericValue: 1,
            textValue: null,
            notes: 'Marked queen spotted',
          },
        ],
      };

      mockPrismaService.inspection.findUnique.mockResolvedValue(expectedInspection);

      // Act
      const result = await service.findOne(inspectionId);

      // Assert
      expect(result).toEqual(expectedInspection);
      expect(mockPrismaService.inspection.findUnique).toHaveBeenCalledWith({
        where: { id: inspectionId },
        include: {
          observations: true,
        },
      });
      // Since we explicitly mock the return value, we know it's not null
      expect(result).not.toBeNull();
      if (result) {
        expect(result.observations).toBeDefined();
        expect(result.observations.length).toBe(2);
        expect(result.observations[0].type).toBe('BROOD_PATTERN');
        expect(result.observations[1].type).toBe('QUEEN_SEEN');
      }
    });

    it('should find one inspection without observations', async () => {
      // Arrange
      const inspectionId = '123e4567-e89b-12d3-a456-426614174001';
      const expectedInspection = {
        id: inspectionId,
        hiveId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2025-03-01'),
        temperature: 25.5,
        weatherConditions: 'Sunny',
        observations: [],
      };

      mockPrismaService.inspection.findUnique.mockResolvedValue(expectedInspection);

      // Act
      const result = await service.findOne(inspectionId);

      // Assert
      expect(result).toEqual(expectedInspection);
      expect(mockPrismaService.inspection.findUnique).toHaveBeenCalledWith({
        where: { id: inspectionId },
        include: {
          observations: true,
        },
      });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.observations).toBeDefined();
        expect(result.observations.length).toBe(0);
      }
    });

    it('should return null when inspection is not found', async () => {
      // Arrange
      const inspectionId = 'non-existent-id';
      mockPrismaService.inspection.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findOne(inspectionId);

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.inspection.findUnique).toHaveBeenCalledWith({
        where: { id: inspectionId },
        include: {
          observations: true,
        },
      });
    });
  });
});
