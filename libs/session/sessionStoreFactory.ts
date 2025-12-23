import session from 'express-session';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { RedisStore } from 'connect-redis';

const pgSession = require('connect-pg-simple')(session);

export interface SessionStoreConfig {
  type: 'postgres' | 'redis' | 'auto';
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
 * Priority (when type is 'auto'):
 * 1. Redis if REDIS_URL or REDIS_HOST is set
 * 2. PostgreSQL as fallback
 *
 * @param config - Session store configuration
 * @returns Session store instance and metadata
 */
export function createSessionStore(config: SessionStoreConfig): SessionStoreResult {
  const { type, postgres, redis } = config;

  // Determine which store to use
  const useRedis = type === 'redis' || (type === 'auto' && isRedisConfigured());
  const usePostgres = type === 'postgres' || (type === 'auto' && !isRedisConfigured());

  if (useRedis) {
    return createRedisStore(redis);
  }

  if (usePostgres) {
    return createPostgresStore(postgres);
  }

  throw new Error('No valid session store configuration provided');
}

/**
 * Check if Redis is configured via environment variables
 */
function isRedisConfigured(): boolean {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
}

/**
 * Creates a Redis session store
 */
function createRedisStore(config?: SessionStoreConfig['redis']): SessionStoreResult {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = config?.host || process.env.REDIS_HOST || 'localhost';
  const redisPort = config?.port || parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisPassword = config?.password || process.env.REDIS_PASSWORD;
  const redisDb = config?.db || parseInt(process.env.REDIS_DB || '0', 10);

  let client: Redis;

  if (redisUrl) {
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  } else {
    client = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      db: redisDb,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  }

  // Handle Redis connection events
  client.on('connect', () => {});

  client.on('error', err => {});

  client.on('ready', () => {});

  const store = new RedisStore({
    client,
    prefix: config?.keyPrefix || process.env.REDIS_SESSION_PREFIX || 'sess:',
    ttl: 60 * 60 * 3, // 3 hours (matches session maxAge)
  });

  return {
    store,
    type: 'redis',
    client,
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
export async function closeSessionStore(result: SessionStoreResult): Promise<void> {
  if (result.type === 'redis' && result.client) {
    await result.client.quit();
  }
  // PostgreSQL pool is managed externally
}
