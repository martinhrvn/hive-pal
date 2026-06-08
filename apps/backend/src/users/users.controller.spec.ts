import { UsersController } from './users.controller';
import { createControllerTestModule } from '../test/service-test.helper';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const { controller: ctrl } =
      await createControllerTestModule(UsersController);
    controller = ctrl;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
