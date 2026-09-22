/**
 * Shared cache port — same contract whether backed by in-process memory
 * or Redis. Callers never know which is active; `createCache` in
 * `libs/cache` picks the backend from environment config.
 *
 * `T` is the cached value type, bound per cache instance.
 */
export interface Cache<T = unknown> {
  /** Backend identifier for observability/tests. */
  readonly kind: 'memory' | 'redis';

  get(key: string): Promise<T | undefined>;

  set(key: string, value: T, ttlMs?: number): Promise<void>;

  /**
   * Return the cached value, or compute + store it on a miss.
   * Implementations are fail-open: backend errors fall through to `loader`.
   */
  getOrSet(key: string, loader: () => Promise<T>, ttlMs?: number): Promise<T>;

  del(key: string): Promise<void>;

  /** Drop all entries owned by this cache instance (its namespace). */
  clear(): Promise<void>;
}
