import {
  PersistedQueryStore,
  persistedQueryStore,
  initPersistedQueries,
} from './persistedQueries';

jest.mock('./logger', () => ({
  logger: { info: jest.fn(), warning: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('persistedQueries', () => {
  describe('PersistedQueryStore', () => {
    let store: PersistedQueryStore;

    beforeEach(() => {
      store = new PersistedQueryStore();
    });

    it('allows all queries when disabled', () => {
      expect(store.isQueryAllowed('{ products { id } }')).toBe(true);
    });

    it('rejects unregistered queries when enabled', () => {
      store.enable();
      expect(store.isQueryAllowed('{ products { id } }')).toBe(false);
    });

    it('allows registered queries when enabled', () => {
      const query = '{ products { id } }';
      const hash = PersistedQueryStore.hashQuery(query);
      store.register(hash, query);
      store.enable();
      expect(store.isQueryAllowed(query)).toBe(true);
    });

    it('getQuery returns null for unknown hash', () => {
      expect(store.getQuery('unknown')).toBeNull();
    });

    it('getQuery returns query for known hash', () => {
      store.register('abc123', '{ test }');
      expect(store.getQuery('abc123')).toBe('{ test }');
    });

    it('disable allows all queries again', () => {
      store.enable();
      store.disable();
      expect(store.isEnabled()).toBe(false);
      expect(store.isQueryAllowed('{ anything }')).toBe(true);
    });

    it('hashQuery produces consistent SHA-256 hashes', () => {
      const hash1 = PersistedQueryStore.hashQuery('{ test }');
      const hash2 = PersistedQueryStore.hashQuery('{ test }');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex
    });

    it('hashQuery produces different hashes for different queries', () => {
      const hash1 = PersistedQueryStore.hashQuery('{ test1 }');
      const hash2 = PersistedQueryStore.hashQuery('{ test2 }');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('initPersistedQueries', () => {
    afterEach(() => {
      persistedQueryStore.disable();
      delete process.env.GRAPHQL_PERSISTED_QUERIES;
      delete process.env.GRAPHQL_PERSISTED_QUERIES_FILE;
    });

    it('does nothing when GRAPHQL_PERSISTED_QUERIES is not set', () => {
      initPersistedQueries();
      expect(persistedQueryStore.isEnabled()).toBe(false);
    });

    it('attempts to load when GRAPHQL_PERSISTED_QUERIES=true', () => {
      process.env.GRAPHQL_PERSISTED_QUERIES = 'true';
      process.env.GRAPHQL_PERSISTED_QUERIES_FILE = '/nonexistent/path.json';
      initPersistedQueries();
      // File doesn't exist, so store should not be enabled
      expect(persistedQueryStore.isEnabled()).toBe(false);
    });
  });
});
