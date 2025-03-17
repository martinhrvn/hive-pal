module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  rootDir: './',
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^src$': '<rootDir>/src',
    '^src/(.+)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['src/typings'],
  testPathIgnorePatterns: [
    '/node_modules./',
    '<rootDir>/(coverage|dist|lib|tmp)./',
  ],
};
