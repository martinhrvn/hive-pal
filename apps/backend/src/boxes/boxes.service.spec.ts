import { Test, TestingModule } from '@nestjs/testing';
import { BoxesService } from './boxes.service';

describe('BoxesService', () => {
  let service: BoxesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoxesService],
    }).compile();

    service = module.get<BoxesService>(BoxesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
