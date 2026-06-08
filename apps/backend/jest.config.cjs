// Better Auth ships as ESM only, which ts-jest (CommonJS) cannot import in unit
// tests. Map those packages to a lightweight mock. The e2e config (jest.e2e.cjs)
// strips these entries so it exercises the real auth stack.
const authMockTarget = '<rootDir>/src/test/mocks/better-auth.mock.ts';
const betterAuthMockMapper = {
  '^@thallesp/nestjs-better-auth$': authMockTarget,
  '^@better-auth/passkey$': authMockTarget,
  '^better-auth$': authMockTarget,
  '^better-auth/(.*)$': authMockTarget,
};

module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  rootDir: './',
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^@/prisma/client$': '<rootDir>/src/generated/prisma/client',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^src$': '<rootDir>/src',
    '^src/(.+)$': '<rootDir>/src/$1',
    ...betterAuthMockMapper,
  },
  modulePathIgnorePatterns: ['src/typings'],
  testPathIgnorePatterns: [
    '/node_modules./',
    '<rootDir>/(coverage|dist|lib|tmp)./',
  ],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
      },
    ],
  ],
};
