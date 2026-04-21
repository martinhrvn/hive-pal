import { UsersService } from './users.service';
import { createServiceTestModule } from '../test/service-test.helper';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const { service: svc } = await createServiceTestModule(UsersService);
    service = svc;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
