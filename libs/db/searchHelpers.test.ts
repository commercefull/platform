import { buildILikeSearch, buildFtsSearch, buildSearchCondition, buildSearchOrderBy, getSearchStrategy } from './searchHelpers';

describe('searchHelpers', () => {
  describe('buildILikeSearch', () => {
    it('builds ILIKE OR condition across multiple columns', () => {
      const result = buildILikeSearch('john', ['"name"', '"email"', '"phone"'], 1);
      expect(result.clause).toBe('AND ("name" ILIKE $1 OR "email" ILIKE $1 OR "phone" ILIKE $1)');
      expect(result.params).toEqual(['%john%']);
      expect(result.paramCount).toBe(1);
    });

    it('uses correct startParamIndex', () => {
      const result = buildILikeSearch('jane', ['"firstName"', '"lastName"'], 5);
      expect(result.clause).toBe('AND ("firstName" ILIKE $5 OR "lastName" ILIKE $5)');
      expect(result.params).toEqual(['%jane%']);
    });

    it('returns empty for empty search term', () => {
      const result = buildILikeSearch('', ['"name"'], 1);
      expect(result.clause).toBe('');
      expect(result.params).toEqual([]);
      expect(result.paramCount).toBe(0);
    });

    it('returns empty for empty columns', () => {
      const result = buildILikeSearch('test', [], 1);
      expect(result.clause).toBe('');
      expect(result.paramCount).toBe(0);
    });
  });

  describe('buildFtsSearch', () => {
    it('builds FTS condition with to_tsvector and plainto_tsquery', () => {
      const result = buildFtsSearch('john doe', ['"name"', '"email"'], 1);
      expect(result.clause).toContain("to_tsvector('simple'");
      expect(result.clause).toContain("plainto_tsquery('simple', $1)");
      expect(result.clause).toContain('COALESCE("name", \'\')');
      expect(result.clause).toContain('COALESCE("email", \'\')');
      expect(result.params).toEqual(['john doe']);
      expect(result.paramCount).toBe(1);
    });

    it('supports custom tsConfig', () => {
      const result = buildFtsSearch('test', ['"title"'], 1, 'english');
      expect(result.clause).toContain("'english'");
      expect(result.clause).not.toContain("'simple'");
    });

    it('returns empty for empty search term', () => {
      const result = buildFtsSearch('', ['"name"'], 1);
      expect(result.clause).toBe('');
      expect(result.paramCount).toBe(0);
    });
  });

  describe('buildSearchCondition', () => {
    it('delegates to ILIKE by default', () => {
      const result = buildSearchCondition('test', ['"name"'], 1);
      expect(result.clause).toContain('ILIKE');
      expect(result.clause).not.toContain('to_tsvector');
      expect(result.params).toEqual(['%test%']);
    });

    it('returns empty for empty search term', () => {
      const result = buildSearchCondition('', ['"name"'], 1);
      expect(result.clause).toBe('');
      expect(result.paramCount).toBe(0);
    });

    it('returns empty for empty columns', () => {
      const result = buildSearchCondition('test', [], 1);
      expect(result.clause).toBe('');
      expect(result.paramCount).toBe(0);
    });
  });

  describe('buildSearchOrderBy', () => {
    it('builds CASE-based ranking for ilike strategy', () => {
      const orderBy = buildSearchOrderBy('"name"', 'ilike', 1);
      expect(orderBy).toContain('CASE');
      expect(orderBy).toContain('ILIKE $1');
      expect(orderBy).toContain('THEN 1');
      expect(orderBy).toContain('THEN 2');
      expect(orderBy).toContain('ELSE 3');
      expect(orderBy).toContain('ASC');
    });

    it('builds ts_rank-based ordering for fts strategy', () => {
      const orderBy = buildSearchOrderBy('"name"', 'fts', 1);
      expect(orderBy).toContain('ts_rank');
      expect(orderBy).toContain('plainto_tsquery');
      expect(orderBy).toContain('DESC');
    });
  });

  describe('getSearchStrategy', () => {
    it('returns ilike by default', () => {
      expect(getSearchStrategy()).toBe('ilike');
    });
  });
});
