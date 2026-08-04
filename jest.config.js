module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', {
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript' },
        transform: {},
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  collectCoverage: true,
  collectCoverageFrom: ['features/**/*.ts', '!**/node_modules/**', '!**/dist/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
