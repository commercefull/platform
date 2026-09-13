/**
 * PDP processor tests — pure business logic, no DOM required.
 */

import {
  findVariant,
  applyQuantityDelta,
  stockStatusHtml,
  isAddToCartDisabled,
  buildAddToCartPayload,
  parseRecentlyViewed,
  addRecentlyViewed,
} from './processor.js';

describe('PDP processor', () => {
  describe('findVariant', () => {
    const variants = [
      { variantId: '1', size: 'S', colour: 'red', stock: 5 },
      { variantId: '2', size: 'M', colour: 'red', stock: 0 },
      { variantId: '3', size: 'M', colour: 'blue', stock: 10 },
    ];

    it('matches by size and colour', () => {
      expect(findVariant(variants, 'M', 'blue').variantId).toBe('3');
    });

    it('matches by size only when colour is null', () => {
      expect(findVariant(variants, 'S', null).variantId).toBe('1');
    });

    it('matches by colour only when size is null', () => {
      expect(findVariant(variants, null, 'blue').variantId).toBe('3');
    });

    it('returns null when no variant matches', () => {
      expect(findVariant(variants, 'XL', 'green')).toBeNull();
    });

    it('returns null for empty variants array', () => {
      expect(findVariant([], 'S', 'red')).toBeNull();
    });

    it('returns null for null variants', () => {
      expect(findVariant(null, 'S', 'red')).toBeNull();
    });
  });

  describe('applyQuantityDelta', () => {
    it('increments by 1', () => {
      expect(applyQuantityDelta(5, 1)).toBe(6);
    });

    it('decrements by 1', () => {
      expect(applyQuantityDelta(5, -1)).toBe(4);
    });

    it('clamps to minimum of 1 by default', () => {
      expect(applyQuantityDelta(1, -1)).toBe(1);
      expect(applyQuantityDelta(0, -1)).toBe(1);
    });

    it('respects a custom minimum', () => {
      expect(applyQuantityDelta(2, -1, 0)).toBe(1);
      expect(applyQuantityDelta(0, -1, 0)).toBe(0);
    });

    it('parses string input', () => {
      expect(applyQuantityDelta('3', 1)).toBe(4);
    });

    it('treats NaN current as 0', () => {
      expect(applyQuantityDelta(NaN, 1)).toBe(1);
    });
  });

  describe('stockStatusHtml', () => {
    it('returns in-stock message for stock > 10', () => {
      const html = stockStatusHtml(15);
      expect(html).toContain('In Stock');
      expect(html).toContain('text-green-600');
    });

    it('returns low-stock message for stock 1-10', () => {
      const html = stockStatusHtml(5);
      expect(html).toContain('Only 5 left');
      expect(html).toContain('text-amber-600');
    });

    it('returns out-of-stock message for stock 0', () => {
      const html = stockStatusHtml(0);
      expect(html).toContain('Out of Stock');
      expect(html).toContain('text-red-600');
    });
  });

  describe('isAddToCartDisabled', () => {
    it('returns true when variant stock is 0', () => {
      expect(isAddToCartDisabled({ stock: 0 })).toBe(true);
    });

    it('returns false when variant stock is > 0', () => {
      expect(isAddToCartDisabled({ stock: 5 })).toBe(false);
    });

    it('returns false when variant is null', () => {
      expect(isAddToCartDisabled(null)).toBe(false);
    });
  });

  describe('buildAddToCartPayload', () => {
    it('includes size and colour when both are set', () => {
      const payload = buildAddToCartPayload('p1', 2, 'M', 'red');
      expect(payload).toEqual({ productId: 'p1', quantity: 2, size: 'M', colour: 'red' });
    });

    it('omits size and colour when null', () => {
      const payload = buildAddToCartPayload('p1', 1, null, null);
      expect(payload).toEqual({ productId: 'p1', quantity: 1 });
    });

    it('omits size and colour when undefined', () => {
      const payload = buildAddToCartPayload('p1', 1, undefined, undefined);
      expect(payload).toEqual({ productId: 'p1', quantity: 1 });
    });

    it('includes only size when colour is null', () => {
      const payload = buildAddToCartPayload('p1', 3, 'L', null);
      expect(payload).toEqual({ productId: 'p1', quantity: 3, size: 'L' });
    });
  });

  describe('parseRecentlyViewed', () => {
    it('parses a valid JSON array', () => {
      expect(parseRecentlyViewed('["a","b","c"]')).toEqual(['a', 'b', 'c']);
    });

    it('returns empty array for invalid JSON', () => {
      expect(parseRecentlyViewed('not json')).toEqual([]);
    });

    it('returns empty array for null input', () => {
      expect(parseRecentlyViewed(null)).toEqual([]);
    });

    it('returns empty array when parsed value is not an array', () => {
      expect(parseRecentlyViewed('{"a":1}')).toEqual([]);
    });

    it('filters out non-string entries', () => {
      expect(parseRecentlyViewed('["a",123,"b"]')).toEqual(['a', 'b']);
    });
  });

  describe('addRecentlyViewed', () => {
    it('adds a new product to the front', () => {
      expect(addRecentlyViewed(['b', 'c'], 'a')).toEqual(['a', 'b', 'c']);
    });

    it('moves an existing product to the front', () => {
      expect(addRecentlyViewed(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
    });

    it('caps the list at 8 entries by default', () => {
      const viewed = ['1', '2', '3', '4', '5', '6', '7', '8'];
      expect(addRecentlyViewed(viewed, 'new')).toHaveLength(8);
      expect(addRecentlyViewed(viewed, 'new')[0]).toBe('new');
    });

    it('respects a custom max', () => {
      const viewed = ['1', '2', '3'];
      expect(addRecentlyViewed(viewed, 'new', 2)).toEqual(['new', '1']);
    });
  });
});
