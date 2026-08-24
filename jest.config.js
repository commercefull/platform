const http = require('node:http');
const https = require('node:https');
http.globalAgent.setMaxListeners(50);
https.globalAgent.setMaxListeners(50);

const swcTransform = {
  '^.+\\.tsx?$': ['@swc/jest', {
    jsc: {
      target: 'es2022',
      parser: { syntax: 'typescript' },
      transform: {},
    },
  }],
};

const moduleFileExtensions = ['ts', 'tsx', 'js', 'jsx', 'json', 'node'];

module.exports = {
  coverageThreshold: {
    global: {
      statements: 57,
      branches: 41,
      functions: 53,
      lines: 58,
    },
  },
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      roots: ['<rootDir>/modules', '<rootDir>/libs', '<rootDir>/scripts'],
      testMatch: ['**/*.test.ts'],
      transform: swcTransform,
      moduleFileExtensions,
      testTimeout: 30000,
      collectCoverage: true,
      collectCoverageFrom: [
        'modules/**/*.ts',
        'libs/**/*.ts',
        'web/**/*.ts',
        '!**/*.test.ts',
        '!**/node_modules/**',
        '!**/dist/**',
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests/integration'],
      testMatch: ['**/*.test.ts'],
      transform: swcTransform,
      moduleFileExtensions,
      verbose: true,
      testTimeout: 30000,
      detectOpenHandles: false,
      collectCoverage: false,
      globalSetup: '<rootDir>/tests/config/jest.db.global.setup.ts',
      setupFilesAfterEnv: ['<rootDir>/tests/config/jest.db.setup.ts'],
    },
  ],
};
