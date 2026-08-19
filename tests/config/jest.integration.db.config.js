/*
 * Jest configuration for isolated integration tests.
 *
 * This config uses a global setup to:
 *   1. Create a temporary snapshot database
 *   2. Run migrations + seeds on it
 *   3. Dump it to a pg_dump file
 *
 * Then, before each test file, the setup restores that dump into the
 * server's active database — giving every test file a clean, fully-seeded
 * starting state without re-running migrations or seeds.
 *
 * Usage:
 *   npx jest --config tests/config/jest.integration.db.config.js
 */

module.exports = {
  testEnvironment: 'node',
  rootDir: '../../',
  roots: ['<rootDir>/tests/integration'],
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
  collectCoverage: false,
  globalSetup: '<rootDir>/tests/config/jest.db.global.setup.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/config/jest.db.setup.ts'],
};
