import { ApiariesService } from './apiaries.service';
import { createServiceTestModule } from '../test/service-test.helper';

describe('ApiariesService', () => {
  let service: ApiariesService;

  beforeEach(async () => {
    const { service: svc } = await createServiceTestModule(ApiariesService);
    service = svc;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
