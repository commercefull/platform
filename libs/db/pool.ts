/* eslint-disable @typescript-eslint/no-unused-vars */
import PG from 'pg';
import { getTestDbName } from './testDbContext';
import { incrementQueryCounter } from './queryCounter';
import { ConflictError, BadRequestError, NotFoundError } from '../errors';

const isTestEnv = process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test';

// Return PostgreSQL bigint (OID 20) as JS numbers instead of strings.
// Money columns are integer cents and aggregate results (COUNT/SUM/AVG over
// them) fit comfortably within Number.MAX_SAFE_INTEGER. Type parsers are
// global to the `pg` driver, so this covers test pools as well.
PG.types.setTypeParser(20, (val: string) => (val === null ? val : Number(val)));

/**
 * TLS for managed databases (RDS / Cloud SQL / Azure Flexible Server).
 * POSTGRES_SSL=true enables TLS; certificates are verified unless
 * POSTGRES_SSL_REJECT_UNAUTHORIZED=false. POSTGRES_SSL_CA may hold a PEM CA bundle.
 */
const resolveSsl = (): PG.PoolConfig['ssl'] => {
  if (process.env.POSTGRES_SSL !== 'true') return undefined;
  return {
    rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(process.env.POSTGRES_SSL_CA ? { ca: process.env.POSTGRES_SSL_CA } : {}),
  };
};

export const pool = isTestEnv
  ? (null as unknown as PG.Pool)
  : new PG.Pool({
      port: parseInt(process.env.POSTGRES_PORT || '', 10),
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl: resolveSsl(),
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

const closeTestPool = async (database: string): Promise<void> => {
  const p = testPools.get(database);
  if (p) {
    testPools.delete(database);
    await p.end().catch(() => {});
  }
};

/**
 * Map a PostgreSQL error (from `pg`) to an `AppError` subclass so the
 * error middleware returns the correct 4xx status and structured body
 * instead of a generic 500.
 *
 * - 23505 unique_violation     → 409 ConflictError
 * - 23503 foreign_key_violation → 409 ConflictError (referenced row missing/in use)
 * - 23502 not_null_violation   → 400 BadRequestError (missing required field)
 * - 23514 check_violation      → 400 BadRequestError (constraint failed)
 * - 22P02 invalid_text_representation → 400 BadRequestError (e.g. malformed UUID)
 * - 22001 string_data_right_truncation → 400 BadRequestError (field too long)
 * - everything else           → generic Error → 500
 */
function mapPgError(e: unknown): Error {
  const pgErr = e as { code?: string; message?: string; constraint?: string };
  const code = pgErr.code;
  const msg = pgErr.message ?? (e as Error).message;

  switch (code) {
    case '23505':
      return new ConflictError('Resource already exists', { cause: e });
    case '23503':
      return new ConflictError('Referenced resource does not exist or is in use', { cause: e });
    case '23502':
      return new BadRequestError('Missing required field', { cause: e });
    case '23514':
      return new BadRequestError(msg || 'Value violates a database constraint', { cause: e });
    case '22P02':
      return new BadRequestError(`Invalid input format: ${msg}`, { cause: e });
    case '22001':
      return new BadRequestError('Value too long for field', { cause: e });
    default:
      return new Error(`Query failed: ${msg}`, { cause: e });
  }
}

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
    throw mapPgError(e);
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
    throw mapPgError(e);
  }

  if (res.rows.length === 1) {
    return res.rows[0] as unknown as T;
  }

  return null;
};
