import PG from 'pg';
import { getTestDbName } from './testDbContext';
import { incrementQueryCounter } from './queryCounter';

const isTestEnv = process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test';

export const pool = isTestEnv
  ? (null as unknown as PG.Pool)
  : new PG.Pool({
      port: parseInt(process.env.POSTGRES_PORT || '', 10),
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      max: 20, // maximum number of connections in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
    });

// Cache of per-database pools for test isolation
const testPools = new Map<string, PG.Pool>();

const getTestPool = (database: string): PG.Pool => {
  let p = testPools.get(database);
  if (!p) {
    p = new PG.Pool({
      port: parseInt(process.env.POSTGRES_PORT || '', 10),
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database,
      max: 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 2000,
    });
    // Swallow pool-level errors so the server doesn't crash when
    // a test DB is dropped (connections get killed by DROP DATABASE FORCE)
    p.on('error', (_err: Error) => {
      // Pool error — likely a killed connection during test DB teardown
    });
    testPools.set(database, p);
  }
  return p;
};

export const getActivePool = (): PG.Pool => {
  const testDb = getTestDbName();
  if (testDb) {
    return getTestPool(testDb);
  }
  return pool;
};

export const closeAllTestPools = async (): Promise<void> => {
  const entries = [...testPools.entries()];
  testPools.clear();
  for (const [, p] of entries) {
    await p.end().catch(() => {});
  }
};

export const closeTestPool = async (database: string): Promise<void> => {
  const p = testPools.get(database);
  if (p) {
    testPools.delete(database);
    await p.end().catch(() => {});
  }
};

export const query = async <T>(text: string, params?: Array<unknown>): Promise<T | null> => {
  let res: PG.QueryResult;

  try {
    const activePool = getActivePool();
    incrementQueryCounter(text);
    if (params !== undefined) {
      res = await activePool.query(text, params);
    } else {
      res = await activePool.query(text);
    }
  } catch (e: unknown) {
    throw new Error(`Query failed: ${(e as Error).message}`, { cause: e });
  }

  if (res.rows.length > 0) {
    return res.rows as unknown as T;
  }

  return null;
};

export const queryOne = async <T>(text: string, params: Array<unknown>): Promise<T | null> => {
  let res: PG.QueryResult;

  try {
    const activePool = getActivePool();
    incrementQueryCounter(text);
    res = await activePool.query(text, params);
  } catch (e: unknown) {
    throw new Error(`Query failed: ${(e as Error).message}`, { cause: e });
  }

  if (res.rows.length === 1) {
    return res.rows[0] as unknown as T;
  }

  return null;
};
