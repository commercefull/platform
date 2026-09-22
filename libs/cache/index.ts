import { getRedisClient, isRedisConfigured } from '../redisClient';
import { MemoryCache } from './memoryCache';
import { RedisCache } from './redisCache';
import type { Cache } from './types';

export type { Cache } from './types';
export { MemoryCache } from './memoryCache';
export { RedisCache } from './redisCache';

export type CacheBackendType = 'memory' | 'redis';

/**
 * Resolve the cache backend type. Explicit only — no auto-detection:
 * CACHE_BACKEND must be 'memory' or 'redis' (default 'memory'). 'redis'
 * fails fast when REDIS_URL/REDIS_HOST is not configured.
 */
export function resolveCacheBackendType(): CacheBackendType {
  const type = process.env.CACHE_BACKEND || 'memory';
  if (type !== 'memory' && type !== 'redis') {
    throw new Error(`Invalid CACHE_BACKEND "${type}" — expected "memory" or "redis"`);
  }
  if (type === 'redis' && !isRedisConfigured()) {
    throw new Error('CACHE_BACKEND=redis requires REDIS_URL or REDIS_HOST');
  }
  return type;
}

export interface CacheConfig {
  /** Logical name — prefixes Redis keys as `cache:<namespace>:*`. */
  namespace: string;
  /** Default entry TTL in milliseconds (per-call override available). */
  ttlMs: number;
  /** Explicit backend. Omitted → CACHE_BACKEND env (default 'memory'). */
  type?: CacheBackendType;
}

/**
 * Create a namespaced cache. Backend is explicit only: pass `type`, or
 * rely on CACHE_BACKEND env ('memory' | 'redis', default 'memory').
 *
 * Usage:
 *   const storeCache = createCache({ namespace: 'store', ttlMs: 30_000 });
 *   const store = await storeCache.getOrSet(slug, () => loadStore(slug));
 */
export function createCache<T = unknown>(config: CacheConfig): Cache<T> {
  const type = config.type ?? resolveCacheBackendType();
  if (type === 'redis') {
    if (!isRedisConfigured()) {
      throw new Error('Cache type "redis" requires REDIS_URL or REDIS_HOST');
    }
    return new RedisCache<T>(getRedisClient(), config.namespace, config.ttlMs);
  }
  return new MemoryCache<T>(config.ttlMs);
}
