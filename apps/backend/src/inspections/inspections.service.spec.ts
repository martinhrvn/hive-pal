import { Test, TestingModule } from '@nestjs/testing';
import { InspectionsService } from './inspections.service';

describe('InspectionsService', () => {
  let service: InspectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InspectionsService],
    }).compile();

    service = module.get<InspectionsService>(InspectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
