import type Redis from 'ioredis';
import { logger } from '../logger';
import type { Cache } from './types';

/**
 * Redis-backed cache. Values are JSON-serialized; keys are namespaced as
 * `cache:<namespace>:<key>`. All operations fail open — a Redis outage
 * degrades to direct loader calls rather than request failures.
 */
export class RedisCache<T = unknown> implements Cache<T> {
  readonly kind = 'redis' as const;
  private readonly prefix: string;

  constructor(
    private readonly client: Redis,
    namespace: string,
    private readonly defaultTtlMs: number,
  ) {
    this.prefix = `cache:${namespace}:`;
  }

  async get(key: string): Promise<T | undefined> {
    try {
      const raw = await this.client.get(this.prefix + key);
      return raw === null ? undefined : (JSON.parse(raw) as T);
    } catch (e) {
      logger.warn('Redis cache get failed — treating as miss', { key, error: (e as Error).message });
      return undefined;
    }
  }

  async set(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      await this.client.set(this.prefix + key, JSON.stringify(value), 'PX', ttlMs ?? this.defaultTtlMs);
    } catch (e) {
      logger.warn('Redis cache set failed', { key, error: (e as Error).message });
    }
  }

  async getOrSet(key: string, loader: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = await this.get(key);
    if (cached !== undefined) return cached;
    const value = await loader();
    await this.set(key, value, ttlMs);
    return value;
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(this.prefix + key);
    } catch (e) {
      logger.warn('Redis cache del failed', { key, error: (e as Error).message });
    }
  }

  async clear(): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [next, keys] = await this.client.scan(cursor, 'MATCH', `${this.prefix}*`, 'COUNT', 200);
        cursor = next;
        if (keys.length > 0) await this.client.del(...keys);
      } while (cursor !== '0');
    } catch (e) {
      logger.warn('Redis cache clear failed', { error: (e as Error).message });
    }
  }
}
