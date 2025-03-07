import { Test, TestingModule } from '@nestjs/testing';
import { HiveService } from './hive.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateHiveBoxesDto, BoxTypeDto } from './dto/update-hive-boxes.dto';

describe('HiveService', () => {
  let service: HiveService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    hive: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    box: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HiveService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HiveService>(HiveService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateBoxes', () => {
    it('should throw NotFoundException if hive does not exist', async () => {
      // Arrange
      const hiveId = 'non-existent-id';
      const updateHiveBoxesDto: UpdateHiveBoxesDto = {
        boxes: [],
      };

      mockPrismaService.hive.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateBoxes(hiveId, updateHiveBoxesDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.hive.findUnique).toHaveBeenCalledWith({
        where: { id: hiveId },
      });
    });

    it('should replace existing boxes with new boxes', async () => {
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

      const mockHive = {
        id: hiveId,
        name: 'Test Hive',
        apiaryId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'ACTIVE',
        notes: 'Test notes',
        installationDate: new Date('2025-01-01'),
      };

      const mockBox1 = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        hiveId,
        position: 0,
        frameCount: 8,
        capacity: 10,
        hasExcluder: false,
        type: 'BROOD',
      };

      const mockBox2 = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        hiveId,
        position: 1,
        frameCount: 5,
        capacity: 10,
        hasExcluder: true,
        type: 'HONEY',
      };

      const expectedResult = {
        ...mockHive,
        boxes: [mockBox1, mockBox2],
      };

      mockPrismaService.hive.findUnique
        .mockResolvedValueOnce(mockHive) // First call to check if hive exists
        .mockResolvedValueOnce(expectedResult); // Second call to return the updated hive

      mockPrismaService.box.create
        .mockResolvedValueOnce(mockBox1)
        .mockResolvedValueOnce(mockBox2);

      // Act
      const result = await service.updateBoxes(hiveId, updateHiveBoxesDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.hive.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.box.deleteMany).toHaveBeenCalledWith({
        where: { hiveId },
      });
      expect(mockPrismaService.box.create).toHaveBeenCalledTimes(2);
      
      // Verify first box creation
      expect(mockPrismaService.box.create).toHaveBeenCalledWith({
        data: {
          hiveId,
          position: updateHiveBoxesDto.boxes[0].position,
          frameCount: updateHiveBoxesDto.boxes[0].frameCount,
          capacity: updateHiveBoxesDto.boxes[0].capacity,
          hasExcluder: updateHiveBoxesDto.boxes[0].hasExcluder,
          type: updateHiveBoxesDto.boxes[0].type,
        },
      });
      
      // Verify second box creation
      expect(mockPrismaService.box.create).toHaveBeenCalledWith({
        data: {
          hiveId,
          position: updateHiveBoxesDto.boxes[1].position,
          frameCount: updateHiveBoxesDto.boxes[1].frameCount,
          capacity: updateHiveBoxesDto.boxes[1].capacity,
          hasExcluder: updateHiveBoxesDto.boxes[1].hasExcluder,
          type: updateHiveBoxesDto.boxes[1].type,
        },
      });
    });

    it('should handle empty boxes array', async () => {
      // Arrange
      const hiveId = '123e4567-e89b-12d3-a456-426614174000';
      const updateHiveBoxesDto: UpdateHiveBoxesDto = {
        boxes: [],
      };

      const mockHive = {
        id: hiveId,
        name: 'Test Hive',
        apiaryId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'ACTIVE',
        notes: 'Test notes',
        installationDate: new Date('2025-01-01'),
        boxes: [],
      };

      mockPrismaService.hive.findUnique
        .mockResolvedValueOnce(mockHive) // First call to check if hive exists
        .mockResolvedValueOnce(mockHive); // Second call to return the updated hive

      // Act
      const result = await service.updateBoxes(hiveId, updateHiveBoxesDto);

      // Assert
      expect(result).toEqual(mockHive);
      expect(mockPrismaService.hive.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.box.deleteMany).toHaveBeenCalledWith({
        where: { hiveId },
      });
      expect(mockPrismaService.box.create).not.toHaveBeenCalled();
    });
  });
});