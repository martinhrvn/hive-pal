import { Test, TestingModule } from '@nestjs/testing';

export async function createServiceTestModule<T>(
  service: new (...args: any[]) => T,
): Promise<{ module: TestingModule; service: T }> {
  const module = await Test.createTestingModule({
    providers: [service],
  }).compile();

  return {
    module,
    service: module.get<T>(service),
  };
}
