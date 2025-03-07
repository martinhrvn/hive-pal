import { Test, TestingModule } from '@nestjs/testing';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';

describe('InspectionsController', () => {
  let controller: InspectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionsController],
      providers: [
        {
          provide: InspectionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InspectionsController>(InspectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
