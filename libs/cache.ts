import NodeCache from 'node-cache';

let cache: NodeCache;

export function setupCache() {
  cache = new NodeCache({
    stdTTL: 60 * 60, // 1 hour
    useClones: false,
  });

  return cache;
}

export function getCache<T>(key: string) {
  return cache.get<T>(key);
}

export function setCache<T>(key: string, value: T) {
  cache.set<T>(key, value);
}

export function delCache(key: string) {
  cache.del(key);
}

export function flushCache() {
  cache.flushAll();
}

export function hasCache(key: string) {
  return cache.has(key);
}
