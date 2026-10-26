import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    // Resolve the `@/prisma/client` path alias straight from tsconfig.json.
    tsconfigPaths(),
    // NestJS DI relies on `design:paramtypes` metadata, which esbuild (Vitest's
    // default transform) does not emit. SWC reproduces tsc's
    // `emitDecoratorMetadata` so `Test.createTestingModule().useMocker()` can
    // resolve constructor dependencies.
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2023',
        parser: { syntax: 'typescript', decorators: true },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          useDefineForClassFields: false,
        },
        keepClassNames: true,
      },
    }),
  ],
  resolve: {
    // Source imports the generated Prisma client with a `.js` extension
    // (e.g. `../generated/prisma/client.js`) while the files are actually
    // `.ts`. Let Vite resolve `.js` specifiers to the real `.ts`/`.mts` files.
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.mjs': ['.mts', '.mjs'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // better-auth 1.7.13's oauth-provider plugin validates the issuer/baseURL
    // at init, so modules that construct `betterAuth()` at import time need a
    // valid BETTER_AUTH_URL even in the env-less unit project.
    env: {
      BETTER_AUTH_URL: 'http://localhost:3000',
    },
    setupFiles: ['reflect-metadata'],
    reporters: ['default', ['junit', {}]],
    outputFile: { junit: './test-results/junit.xml' },
    // Vitest 4 removed `coverage.all`; name the sources explicitly so
    // `test:cov` keeps reporting untested files.
    coverage: { include: ['src/**'] },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['test/**/*.e2e-spec.ts'],
          testTimeout: 30000,
          hookTimeout: 30000,
          setupFiles: ['reflect-metadata', './test/setup-e2e.ts'],
          // The e2e specs share one database and wipe tables in beforeAll, so
          // they must not run in parallel across files.
          fileParallelism: false,
        },
      },
    ],
  },
});
