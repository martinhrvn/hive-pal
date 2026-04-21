import { QueensService } from './queens.service';
import { createServiceTestModule } from '../test/service-test.helper';

describe('QueensService', () => {
  let service: QueensService;

  beforeEach(async () => {
    const { service: svc } = await createServiceTestModule(QueensService);
    service = svc;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
