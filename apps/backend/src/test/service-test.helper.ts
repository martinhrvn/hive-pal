import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

// Auto-mocks any constructor dependency (e.g. PrismaService, CustomLoggerService)
// so smoke tests can instantiate a provider/controller without wiring every
// dependency by hand. Each dependency is a Proxy that returns a fresh vi.fn()
// for any accessed member, so calls made in constructors (e.g.
// `logger.setContext(...)`) don't blow up. Non-class tokens (e.g. the
// `Symbol(AUTH_MODULE_OPTIONS)` injected into the real Better Auth guard bound
// via `@UseGuards`) are mocked the same way so guard instantiation resolves.
const autoMocker = (): unknown => {
  return new Proxy(
    {},
    {
      get: (target: Record<string | symbol, unknown>, prop) => {
        // Never look like a thenable, or `await`/Nest's promise detection
        // will treat the mock as a Promise that never resolves.
        if (prop === 'then' || typeof prop === 'symbol') {
          return undefined;
        }
        if (!(prop in target)) {
          target[prop] = vi.fn();
        }
        return target[prop];
      },
    },
  );
};

export async function createServiceTestModule<T>(
  service: new (...args: any[]) => T,
): Promise<{ module: TestingModule; service: T }> {
  const module = await Test.createTestingModule({
    providers: [service],
  })
    .useMocker(autoMocker)
    .compile();

  return {
    module,
    service: module.get<T>(service),
  };
}

export async function createControllerTestModule<T>(
  controller: new (...args: any[]) => T,
): Promise<{ module: TestingModule; controller: T }> {
  const module = await Test.createTestingModule({
    controllers: [controller],
  })
    .useMocker(autoMocker)
    .compile();

  return {
    module,
    controller: module.get<T>(controller),
  };
}
