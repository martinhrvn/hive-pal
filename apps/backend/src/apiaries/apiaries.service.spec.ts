import { Test, TestingModule } from '@nestjs/testing';
import { ApiariesService } from './apiaries.service';

describe('ApiariesService', () => {
  let service: ApiariesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiariesService],
    }).compile();

    service = module.get<ApiariesService>(ApiariesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
