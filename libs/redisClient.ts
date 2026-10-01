import Redis, { RedisOptions } from 'ioredis';
import { logger } from './logger';

/** Consumers import the client type from here — `ioredis` stays confined to this file. */
export type { default as Redis } from 'ioredis';

export interface RedisConnectionConfig {
  url?: string;
  path?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

/**
 * Shared ioredis connection for cache/session backends.
 * Connection env convention: REDIS_URL, or REDIS_HOST/REDIS_PORT/REDIS_PASSWORD/REDIS_DB.
 */
let sharedClient: Redis | undefined;
let errorLogged = false;

export function isRedisConfigured(): boolean {
  return !!(process.env.REDIS_URL || process.env.REDIS_SOCKET || process.env.REDIS_HOST);
}

/**
 * Common resilience options: capped exponential backoff reconnect,
 * offline queue while reconnecting, TCP keepalive.
 */
function redisClientOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 5000,
    keepAlive: 10_000,
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
    reconnectOnError: () => true,
  };
}

function attachErrorLogging(client: Redis): void {
  client.on('error', err => {
    // Log once per outage instead of on every reconnect attempt
    if (!errorLogged) {
      errorLogged = true;
      logger.error('Redis connection error', { error: err.message });
    }
  });
  client.on('ready', () => {
    if (errorLogged) logger.info('Redis connection restored');
    errorLogged = false;
  });
}

/**
 * Create a new (unshared) client for callers that need an explicit
 * connection rather than the shared one.
 */
export function createRedisClient(config: RedisConnectionConfig = {}): Redis {
  const client = config.url
    ? new Redis(config.url, redisClientOptions())
    : config.path
      ? new Redis(config.path, {
          password: config.password || undefined,
          db: config.db || 0,
          ...redisClientOptions(),
        })
      : new Redis({
          host: config.host || 'localhost',
          port: config.port || 6379,
          password: config.password || undefined,
          db: config.db || 0,
          ...redisClientOptions(),
        });
  attachErrorLogging(client);
  return client;
}

export function getRedisClient(): Redis {
  if (!sharedClient) {
    sharedClient = createRedisClient({
      url: process.env.REDIS_URL,
      path: process.env.REDIS_SOCKET,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    });
  }
  return sharedClient;
}

export async function closeRedisClient(): Promise<void> {
  const client = sharedClient;
  sharedClient = undefined;
  if (client) await client.quit();
}
