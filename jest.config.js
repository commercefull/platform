module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/features'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testTimeout: 30000,
  // Force Jest to exit after tests complete to avoid open handle warnings
  forceExit: true,
  // Detect open handles for debugging (can be disabled in CI)
  detectOpenHandles: false,
  collectCoverage: true,
  collectCoverageFrom: ['features/**/*.ts', '!**/node_modules/**', '!**/dist/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
