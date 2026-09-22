import type { Cache } from './types';

/**
 * In-process cache backed by a Map with per-entry expiry. Suitable for
 * single-instance deployments and as the automatic fallback when Redis
 * isn't configured.
 *
 * TTL-only invalidation — entries go stale for at most `defaultTtlMs`
 * (or the per-call `ttlMs` override). Falsy values like `null`/`false`
 * are cached normally; only `undefined` means "miss".
 */
export class MemoryCache<T = unknown> implements Cache<T> {
  readonly kind = 'memory' as const;
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();

  constructor(private readonly defaultTtlMs: number) {}

  async get(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: T, ttlMs?: number): Promise<void> {
    this.entries.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
  }

  async getOrSet(key: string, loader: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = await this.get(key);
    if (cached !== undefined) return cached;
    const value = await loader();
    await this.set(key, value, ttlMs);
    return value;
  }

  async del(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }
}
