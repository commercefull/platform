/**
 * Search processor tests — pure business logic, no DOM required.
 */

import { parseRecentSearches, addRecentSearch, buildSortUrl, resolveSortUrl } from './processor.js';

describe('Search processor', () => {
  describe('parseRecentSearches', () => {
    it('parses a valid JSON array', () => {
      expect(parseRecentSearches('["shirt","jeans"]')).toEqual(['shirt', 'jeans']);
    });

    it('returns empty array for invalid JSON', () => {
      expect(parseRecentSearches('not json')).toEqual([]);
    });

    it('returns empty array for null input', () => {
      expect(parseRecentSearches(null)).toEqual([]);
    });

    it('returns empty array when parsed value is not an array', () => {
      expect(parseRecentSearches('{"a":1}')).toEqual([]);
    });

    it('filters out non-string entries', () => {
      expect(parseRecentSearches('["a",123,"b"]')).toEqual(['a', 'b']);
    });

    it('filters out empty strings', () => {
      expect(parseRecentSearches('["a","","b"]')).toEqual(['a', 'b']);
    });

    it('respects max limit', () => {
      expect(parseRecentSearches('["a","b","c","d","e","f"]', 3)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('addRecentSearch', () => {
    it('adds a new term to the front', () => {
      expect(addRecentSearch(['b', 'c'], 'a')).toEqual(['a', 'b', 'c']);
    });

    it('moves an existing term to the front (case-insensitive)', () => {
      expect(addRecentSearch(['Shirt', 'jeans'], 'shirt')).toEqual(['shirt', 'jeans']);
    });

    it('caps the list at 5 entries by default', () => {
      const recent = ['1', '2', '3', '4', '5'];
      expect(addRecentSearch(recent, 'new')).toHaveLength(5);
      expect(addRecentSearch(recent, 'new')[0]).toBe('new');
    });

    it('respects a custom max', () => {
      expect(addRecentSearch(['1', '2', '3'], 'new', 2)).toEqual(['new', '1']);
    });

    it('returns the original list for empty term', () => {
      expect(addRecentSearch(['a', 'b'], '')).toEqual(['a', 'b']);
    });

    it('returns empty array for null recent and empty term', () => {
      expect(addRecentSearch(null, '')).toEqual([]);
    });

    it('handles null recent with a valid term', () => {
      expect(addRecentSearch(null, 'shirt')).toEqual(['shirt']);
    });
  });

  describe('buildSortUrl', () => {
    it('builds a sort URL with the query and sort value', () => {
      expect(buildSortUrl('shirt', 'price-asc')).toBe('/search?q=shirt&sort=price-asc');
    });

    it('encodes the search query', () => {
      expect(buildSortUrl("men's shirts", 'newest')).toBe("/search?q=men's%20shirts&sort=newest");
    });
  });

  describe('resolveSortUrl', () => {
    const options = [{ dataset: { url: '/search?q=a&sort=relevance' } }, { dataset: { url: '/search?q=a&sort=newest' } }, { dataset: {} }];

    it('returns the URL for the selected option', () => {
      expect(resolveSortUrl(1, options)).toBe('/search?q=a&sort=newest');
    });

    it('returns null when the option has no data-url', () => {
      expect(resolveSortUrl(2, options)).toBeNull();
    });

    it('returns null for an out-of-range index', () => {
      expect(resolveSortUrl(99, options)).toBeNull();
    });
  });
});
