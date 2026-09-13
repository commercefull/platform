/**
 * Header processor tests — pure business logic, no DOM required.
 */

import {
  buildAutocompleteSuggestions,
  suggestionTypeLabel,
  nextSelectedIndex,
  buildCurrencyUrl,
  escapeHtml,
  renderAutocomplete,
} from './processor.js';

describe('Header processor', () => {
  describe('buildAutocompleteSuggestions', () => {
    const data = {
      products: [
        { name: 'Shirt', slug: 'shirt' },
        { name: 'Pants', slug: 'pants', url: '/products/pants-custom' },
      ],
      brands: [{ name: 'Nike', slug: 'nike' }],
      categories: [{ name: 'Men', slug: 'men' }],
    };

    it('maps products with default URL from slug', () => {
      const suggestions = buildAutocompleteSuggestions(data);
      expect(suggestions[0]).toEqual({ type: 'product', name: 'Shirt', url: '/products/shirt', image: undefined });
    });

    it('uses custom URL when provided', () => {
      const suggestions = buildAutocompleteSuggestions(data);
      expect(suggestions[1].url).toBe('/products/pants-custom');
    });

    it('maps brands and categories', () => {
      const suggestions = buildAutocompleteSuggestions(data);
      expect(suggestions[2]).toEqual({ type: 'brand', name: 'Nike', url: '/brands/nike' });
      expect(suggestions[3]).toEqual({ type: 'category', name: 'Men', url: '/categories/men' });
    });

    it('respects max limits', () => {
      const bigData = {
        products: Array.from({ length: 10 }, (_, i) => ({ name: 'P' + i, slug: 's' + i })),
      };
      const suggestions = buildAutocompleteSuggestions(bigData, 3, 0, 0);
      expect(suggestions).toHaveLength(3);
    });

    it('handles null data', () => {
      expect(buildAutocompleteSuggestions(null)).toEqual([]);
    });
  });

  describe('suggestionTypeLabel', () => {
    it('returns Product for product type', () => {
      expect(suggestionTypeLabel('product')).toBe('Product');
    });

    it('returns Brand for brand type', () => {
      expect(suggestionTypeLabel('brand')).toBe('Brand');
    });

    it('returns Category for category type', () => {
      expect(suggestionTypeLabel('category')).toBe('Category');
    });

    it('returns empty string for unknown type', () => {
      expect(suggestionTypeLabel('unknown')).toBe('');
    });
  });

  describe('nextSelectedIndex', () => {
    it('increments by 1 for ArrowDown', () => {
      expect(nextSelectedIndex(0, 1, 5)).toBe(1);
    });

    it('clamps to max index for ArrowDown', () => {
      expect(nextSelectedIndex(4, 1, 5)).toBe(4);
    });

    it('decrements by 1 for ArrowUp', () => {
      expect(nextSelectedIndex(2, -1, 5)).toBe(1);
    });

    it('clamps to -1 for ArrowUp from 0', () => {
      expect(nextSelectedIndex(0, -1, 5)).toBe(-1);
    });

    it('returns -1 for empty results', () => {
      expect(nextSelectedIndex(0, 1, 0)).toBe(-1);
    });
  });

  describe('buildCurrencyUrl', () => {
    it('sets the currency query parameter', () => {
      const url = buildCurrencyUrl('http://localhost/products', 'GBP');
      expect(url).toBe('http://localhost/products?currency=GBP');
    });

    it('replaces existing currency parameter', () => {
      const url = buildCurrencyUrl('http://localhost/products?currency=USD', 'GBP');
      expect(url).toBe('http://localhost/products?currency=GBP');
    });

    it('preserves other parameters', () => {
      const url = buildCurrencyUrl('http://localhost/products?brand=nike', 'GBP');
      expect(url).toContain('brand=nike');
      expect(url).toContain('currency=GBP');
    });
  });

  describe('escapeHtml', () => {
    it('escapes special characters', () => {
      const result = escapeHtml('<script>"&"</script>');
      expect(result).not.toContain('<script>');
    });
  });

  describe('renderAutocomplete', () => {
    it('renders suggestion links', () => {
      const html = renderAutocomplete([{ type: 'product', name: 'Shirt', url: '/products/shirt' }]);
      expect(html).toContain('href="/products/shirt"');
      expect(html).toContain('Shirt');
      expect(html).toContain('Product');
    });

    it('adds selected class for the selected index', () => {
      const html = renderAutocomplete([{ type: 'product', name: 'A', url: '/a' }], 0);
      expect(html).toContain('bg-gray-50');
    });

    it('does not add selected class for unselected items', () => {
      const html = renderAutocomplete([{ type: 'product', name: 'A', url: '/a' }], -1);
      // The selected class appears as "bg-gray-50 bg-gray-50" (hover + selected)
      // When not selected, only "hover:bg-gray-50" appears
      expect(html).not.toContain('50 bg-gray-50');
    });

    it('includes image when provided', () => {
      const html = renderAutocomplete([{ type: 'product', name: 'A', url: '/a', image: '/img.jpg' }]);
      expect(html).toContain('src="/img.jpg"');
    });

    it('escapes malicious names', () => {
      const html = renderAutocomplete([{ type: 'product', name: '<script>alert(1)</script>', url: '/a' }]);
      expect(html).not.toContain('<script>');
    });

    it('returns empty string for empty items', () => {
      expect(renderAutocomplete([])).toBe('');
    });
  });
});
