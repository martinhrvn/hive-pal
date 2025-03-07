import { Test, TestingModule } from '@nestjs/testing';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';

describe('InspectionsController', () => {
  let controller: InspectionsController;
  let service: InspectionsService;

  const mockInspectionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionsController],
      providers: [
        {
          provide: InspectionsService,
          useValue: mockInspectionsService,
        },
      ],
    }).compile();

    controller = module.get<InspectionsController>(InspectionsController);
    service = module.get<InspectionsService>(InspectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an inspection with observations when it exists', async () => {
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

      mockInspectionsService.findOne.mockResolvedValue(expectedInspection);

      // Act
      const result = await controller.findOne(inspectionId);

      // Assert
      expect(result).toEqual(expectedInspection);
      expect(mockInspectionsService.findOne).toHaveBeenCalledWith(inspectionId);

      // Verify observations are included
      expect(result).not.toBeNull();
      if (result) {
        expect(result.observations).toBeDefined();
        expect(result.observations.length).toBe(2);
        expect(result.observations[0].type).toBe('BROOD_PATTERN');
        expect(result.observations[1].type).toBe('QUEEN_SEEN');
      }
    });

    it('should return an inspection with empty observations array', async () => {
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

      mockInspectionsService.findOne.mockResolvedValue(expectedInspection);

      // Act
      const result = await controller.findOne(inspectionId);

      // Assert
      expect(result).toEqual(expectedInspection);
      expect(mockInspectionsService.findOne).toHaveBeenCalledWith(inspectionId);

      // Verify observations is an empty array
      expect(result).not.toBeNull();
      if (result) {
        expect(result.observations).toBeDefined();
        expect(Array.isArray(result.observations)).toBe(true);
        expect(result.observations.length).toBe(0);
      }
    });

    it('should return null when inspection is not found', async () => {
      // Arrange
      const inspectionId = 'non-existent-id';
      mockInspectionsService.findOne.mockResolvedValue(null);

      // Act
      const result = await controller.findOne(inspectionId);

      // Assert
      expect(result).toBeNull();
      expect(mockInspectionsService.findOne).toHaveBeenCalledWith(inspectionId);
    });
  });
});
