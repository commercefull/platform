import Redis, { RedisOptions } from 'ioredis';
import { logger } from './logger';

/**
 * Shared ioredis connection for cache/session backends.
 * Connection env convention: REDIS_URL, or REDIS_HOST/REDIS_PORT/REDIS_PASSWORD/REDIS_DB.
 */
let sharedClient: Redis | undefined;
let errorLogged = false;

export function isRedisConfigured(): boolean {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
}

/**
 * Common resilience options: capped exponential backoff reconnect,
 * offline queue while reconnecting, TCP keepalive.
 */
export function redisClientOptions(): RedisOptions {
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

export function getRedisClient(): Redis {
  if (!sharedClient) {
    sharedClient = process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL, redisClientOptions())
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB || '0', 10),
          ...redisClientOptions(),
        });
    attachErrorLogging(sharedClient);
  }
  return sharedClient;
}
