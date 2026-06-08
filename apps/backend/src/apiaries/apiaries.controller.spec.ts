import { ApiariesController } from './apiaries.controller';
import { createControllerTestModule } from '../test/service-test.helper';

describe('ApiariesController', () => {
  let controller: ApiariesController;

  beforeEach(async () => {
    const { controller: ctrl } =
      await createControllerTestModule(ApiariesController);
    controller = ctrl;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
