import { Test, TestingModule } from '@nestjs/testing';
import { QueensController } from './queens.controller';
import { QueensService } from './queens.service';

describe('QueensController', () => {
  let controller: QueensController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueensController],
      providers: [QueensService],
    }).compile();

    controller = module.get<QueensController>(QueensController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
