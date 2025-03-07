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
});
