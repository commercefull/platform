import { createCache } from './index';
import { MemoryCache } from './memoryCache';

describe('libs/cache', () => {
  describe('MemoryCache', () => {
    it('returns undefined for missing keys', async () => {
      const cache = new MemoryCache(1000);
      expect(await cache.get('nope')).toBeUndefined();
    });

    it('stores and returns values', async () => {
      const cache = new MemoryCache(1000);
      await cache.set('k', { a: 1 });
      expect(await cache.get('k')).toEqual({ a: 1 });
    });

    it('expires entries after the TTL', async () => {
      const cache = new MemoryCache(5);
      await cache.set('k', 'v');
      await new Promise(r => setTimeout(r, 10));
      expect(await cache.get('k')).toBeUndefined();
    });

    it('getOrSet only calls the loader on a miss', async () => {
      const cache = new MemoryCache(1000);
      const loader = jest.fn().mockResolvedValue('loaded');
      expect(await cache.getOrSet('k', loader)).toBe('loaded');
      expect(await cache.getOrSet('k', loader)).toBe('loaded');
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('del removes entries', async () => {
      const cache = new MemoryCache(1000);
      await cache.set('k', 'v');
      await cache.del('k');
      expect(await cache.get('k')).toBeUndefined();
    });
  });

  describe('createCache', () => {
    const env = process.env;
    beforeEach(() => {
      jest.resetModules();
      process.env = { ...env };
      delete process.env.REDIS_URL;
      delete process.env.REDIS_HOST;
      delete process.env.CACHE_BACKEND;
    });
    afterEach(() => {
      process.env = env;
    });

    it('defaults to memory when CACHE_BACKEND is unset', () => {
      const cache = createCache({ namespace: 'test', ttlMs: 1000 });
      expect(cache.kind).toBe('memory');
    });

    it('throws for CACHE_BACKEND=redis when Redis is unconfigured', () => {
      process.env.CACHE_BACKEND = 'redis';
      expect(() => createCache({ namespace: 'test', ttlMs: 1000 })).toThrow('REDIS_URL');
    });

    it('throws for an invalid CACHE_BACKEND value', () => {
      process.env.CACHE_BACKEND = 'auto';
      expect(() => createCache({ namespace: 'test', ttlMs: 1000 })).toThrow('Invalid CACHE_BACKEND');
    });

    it('honours explicit type: memory', () => {
      const cache = createCache({ namespace: 'test', ttlMs: 1000, type: 'memory' });
      expect(cache.kind).toBe('memory');
    });

    it('throws for type: redis when Redis is unconfigured', () => {
      expect(() => createCache({ namespace: 'test', ttlMs: 1000, type: 'redis' })).toThrow('REDIS_URL');
    });
  });
});
