import { Test, TestingModule } from '@nestjs/testing';
import { HiveController } from './hive.controller';
import { HiveService } from './hive.service';
import { UpdateHiveBoxesDto, BoxTypeDto } from './dto/update-hive-boxes.dto';

describe('HiveController', () => {
  let controller: HiveController;
  let service: HiveService;

  const mockHiveService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateBoxes: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HiveController],
      providers: [
        {
          provide: HiveService,
          useValue: mockHiveService,
        },
      ],
    }).compile();

    controller = module.get<HiveController>(HiveController);
    service = module.get<HiveService>(HiveService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateBoxes', () => {
    it('should update boxes for a hive', async () => {
      // Arrange
      const hiveId = '123e4567-e89b-12d3-a456-426614174000';
      const updateHiveBoxesDto: UpdateHiveBoxesDto = {
        boxes: [
          {
            position: 0,
            frameCount: 8,
            capacity: 10,
            hasExcluder: false,
            type: BoxTypeDto.BROOD,
          },
          {
            position: 1,
            frameCount: 5,
            capacity: 10,
            hasExcluder: true,
            type: BoxTypeDto.HONEY,
          },
        ],
      };

      const expectedResult = {
        id: hiveId,
        name: 'Test Hive',
        apiaryId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'ACTIVE',
        notes: 'Test notes',
        installationDate: new Date('2025-01-01'),
        boxes: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            hiveId,
            position: 0,
            frameCount: 8,
            capacity: 10,
            hasExcluder: false,
            type: 'BROOD',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            hiveId,
            position: 1,
            frameCount: 5,
            capacity: 10,
            hasExcluder: true,
            type: 'HONEY',
          },
        ],
      };

      mockHiveService.updateBoxes.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.updateBoxes(hiveId, updateHiveBoxesDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockHiveService.updateBoxes).toHaveBeenCalledWith(hiveId, updateHiveBoxesDto);
    });

    it('should handle empty boxes array', async () => {
      // Arrange
      const hiveId = '123e4567-e89b-12d3-a456-426614174000';
      const updateHiveBoxesDto: UpdateHiveBoxesDto = {
        boxes: [],
      };

      const expectedResult = {
        id: hiveId,
        name: 'Test Hive',
        apiaryId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'ACTIVE',
        notes: 'Test notes',
        installationDate: new Date('2025-01-01'),
        boxes: [],
      };

      mockHiveService.updateBoxes.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.updateBoxes(hiveId, updateHiveBoxesDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockHiveService.updateBoxes).toHaveBeenCalledWith(hiveId, updateHiveBoxesDto);
      expect(result?.boxes).toEqual([]);
    });
  });
});