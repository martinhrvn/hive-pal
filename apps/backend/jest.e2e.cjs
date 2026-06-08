const sharedConfig = require('./jest.config.cjs');

// e2e tests exercise the real Better Auth stack, so drop the unit-only mock
// mappings inherited from the shared config.
const moduleNameMapper = { ...sharedConfig.moduleNameMapper };
for (const key of [
  '^@thallesp/nestjs-better-auth$',
  '^@better-auth/passkey$',
  '^better-auth$',
  '^better-auth/(.*)$',
]) {
  delete moduleNameMapper[key];
}

module.exports = {
  ...sharedConfig,
  moduleNameMapper,
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup-e2e.ts'],
};
