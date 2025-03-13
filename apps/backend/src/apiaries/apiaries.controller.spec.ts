import { Test, TestingModule } from '@nestjs/testing';
import { ApiariesController } from './apiaries.controller';
import { ApiariesService } from './apiaries.service';

describe('ApiariesController', () => {
  let controller: ApiariesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiariesController],
      providers: [ApiariesService],
    }).compile();

    controller = module.get<ApiariesController>(ApiariesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
