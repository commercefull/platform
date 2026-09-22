import { getRedisClient, isRedisConfigured } from '../redisClient';
import { PostgresSessionBackend } from './postgresSessionBackend';
import { RedisSessionBackend } from './redisSessionBackend';
import type { SessionBackend } from './types';

export type SessionBackendType = 'postgres' | 'redis';

/**
 * Resolve the session backend type. Explicit only — no auto-detection:
 * SESSION_BACKEND must be 'postgres' or 'redis' (default 'postgres').
 * 'redis' fails fast when REDIS_URL/REDIS_HOST is not configured so a
 * misconfigured deploy crashes loudly instead of silently using Postgres.
 */
export function resolveSessionBackendType(): SessionBackendType {
  const type = process.env.SESSION_BACKEND || 'postgres';
  if (type !== 'postgres' && type !== 'redis') {
    throw new Error(`Invalid SESSION_BACKEND "${type}" — expected "postgres" or "redis"`);
  }
  if (type === 'redis' && !isRedisConfigured()) {
    throw new Error('SESSION_BACKEND=redis requires REDIS_URL or REDIS_HOST');
  }
  return type;
}

/**
 * Create a session backend.
 * - No argument: resolves from SESSION_BACKEND env
 * - Explicit argument: used directly ('redis' still requires Redis config)
 */
export function createSessionBackend(type?: SessionBackendType): SessionBackend {
  const resolved = type ?? resolveSessionBackendType();
  if (resolved === 'redis') {
    if (!isRedisConfigured()) {
      throw new Error('Session backend "redis" requires REDIS_URL or REDIS_HOST');
    }
    return new RedisSessionBackend(getRedisClient());
  }
  return new PostgresSessionBackend();
}
