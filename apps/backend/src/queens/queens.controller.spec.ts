import { QueensController } from './queens.controller';
import { createControllerTestModule } from '../test/service-test.helper';

describe('QueensController', () => {
  let controller: QueensController;

  beforeEach(async () => {
    const { controller: ctrl } =
      await createControllerTestModule(QueensController);
    controller = ctrl;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
