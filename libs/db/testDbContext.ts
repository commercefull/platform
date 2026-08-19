import { AsyncLocalStorage } from 'node:async_hooks';

interface TestDbContext {
  database: string;
}

const testDbStorage = new AsyncLocalStorage<TestDbContext>();

export const runWithTestDb = <T>(database: string, fn: () => T): T =>
  testDbStorage.run({ database }, fn);

export const getTestDbName = (): string | undefined =>
  testDbStorage.getStore()?.database;
