import { Test, TestingModule } from '@nestjs/testing';
import { QueensService } from './queens.service';

describe('QueensService', () => {
  let service: QueensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueensService],
    }).compile();

    service = module.get<QueensService>(QueensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
