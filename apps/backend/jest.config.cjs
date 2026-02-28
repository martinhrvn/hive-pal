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
