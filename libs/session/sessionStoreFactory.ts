/* eslint-disable @typescript-eslint/no-unused-vars */
import session from 'express-session';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { RedisStore } from 'connect-redis';
import { getRedisClient, redisClientOptions } from '../redisClient';
import { resolveSessionBackendType } from './createSessionBackend';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pgSession = require('connect-pg-simple')(session);

export interface SessionStoreConfig {
  /** Explicit backend. Omitted → SESSION_BACKEND env (default 'postgres'). */
  type?: 'postgres' | 'redis';
  postgres?: {
    pool: Pool;
    tableName?: string;
    pruneSessionInterval?: number;
  };
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    url?: string;
  };
}

export interface SessionStoreResult {
  store: session.Store;
  type: 'postgres' | 'redis';
  client?: Redis;
}

/**
 * Creates a session store based on configuration.
 *
 * Backend is explicit only: pass type, or rely on SESSION_BACKEND env
 * ('postgres' | 'redis', default 'postgres'). 'redis' without
 * REDIS_URL/REDIS_HOST throws instead of silently falling back.
 *
 * @param config - Session store configuration
 * @returns Session store instance and metadata
 */
export function createSessionStore(config: SessionStoreConfig): SessionStoreResult {
  const { postgres, redis } = config;
  const type = config.type ?? resolveSessionBackendType();

  const useRedis = type === 'redis';
  const usePostgres = type === 'postgres';

  if (useRedis) {
    return createRedisStore(redis);
  }

  if (usePostgres) {
    return createPostgresStore(postgres);
  }

  throw new Error('No valid session store configuration provided');
}

/**
 * Creates a Redis session store.
 * Uses the shared ioredis connection from libs/redisClient unless explicit
 * connection overrides are passed via config.
 */
function createRedisStore(config?: SessionStoreConfig['redis']): SessionStoreResult {
  const hasOverrides = !!(config?.host || config?.port || config?.password || config?.db !== undefined || config?.url);

  let client: Redis;
  let ownsClient = false;

  if (hasOverrides) {
    client = config?.url
      ? new Redis(config.url, redisClientOptions())
      : new Redis({
          host: config?.host || 'localhost',
          port: config?.port || 6379,
          password: config?.password || undefined,
          db: config?.db || 0,
          ...redisClientOptions(),
        });
    ownsClient = true;
  } else {
    client = getRedisClient();
  }

  const store = new RedisStore({
    client,
    prefix: config?.keyPrefix || process.env.REDIS_SESSION_PREFIX || 'sess:',
    ttl: 60 * 60 * 3, // 3 hours (matches session maxAge)
  });

  return {
    store,
    type: 'redis',
    client: ownsClient ? client : undefined,
  };
}

/**
 * Creates a PostgreSQL session store
 */
function createPostgresStore(config?: SessionStoreConfig['postgres']): SessionStoreResult {
  if (!config?.pool) {
    throw new Error('PostgreSQL pool is required for PostgreSQL session store');
  }

  const store = new pgSession({
    pool: config.pool,
    tableName: config.tableName || 'session',
    pruneSessionInterval: config.pruneSessionInterval || 60 * 15, // 15 minutes
    createTableIfMissing: true,
  });

  return {
    store,
    type: 'postgres',
  };
}

/**
 * Gracefully close the session store connection
 */
async function closeSessionStore(result: SessionStoreResult): Promise<void> {
  if (result.type === 'redis' && result.client) {
    await result.client.quit();
  }
  // PostgreSQL pool is managed externally
}
