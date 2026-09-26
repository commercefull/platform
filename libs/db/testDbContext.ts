import { AsyncLocalStorage } from 'node:async_hooks';

interface TestDbContext {
  database: string;
}

const testDbStorage = new AsyncLocalStorage<TestDbContext>();

/** Test databases are created as `test_<baseDb>_<hex>` by tests/config/jest.db.setup.ts. */
const TEST_DB_NAME_PATTERN = /^test_[A-Za-z0-9_-]{1,56}$/;
const TEST_DB_ENVIRONMENTS = new Set(['development', 'test']);

export const runWithTestDb = <T>(database: string, fn: () => T): T => testDbStorage.run({ database }, fn);

export const getTestDbName = (): string | undefined => testDbStorage.getStore()?.database;

/**
 * Resolve the `X-Test-Database` header into a database name.
 *
 * The header is only honoured in development/test and only for names that
 * match the test-harness naming scheme. Anywhere else it is ignored, so a
 * client can never redirect queries to an arbitrary database on the server
 * or force the creation of unbounded connection pools.
 */
export const resolveTestDatabase = (headerValue: unknown, nodeEnv: string | undefined = process.env.NODE_ENV): string | undefined => {
  if (!nodeEnv || !TEST_DB_ENVIRONMENTS.has(nodeEnv)) return undefined;
  if (typeof headerValue !== 'string' || !TEST_DB_NAME_PATTERN.test(headerValue)) return undefined;
  return headerValue;
};
