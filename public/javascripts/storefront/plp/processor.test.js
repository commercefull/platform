/**
 * PLP processor tests — pure business logic, no DOM required.
 */

import {
  viewClassName,
  buildPriceFilterUrl,
  resolveFilterUrl,
  resolveSortUrl,
  escapeHtml,
  renderProductCard,
  renderProductCards,
} from './processor.js';

const AMP = '\u0026amp;';
const LT = '\u0026lt;';
const GT = '\u0026gt;';
const QUOT = '\u0026quot;';
const APOS = '\u0026#39;';

describe('PLP processor', () => {
  describe('viewClassName', () => {
    it('returns grid classes by default', () => {
      expect(viewClassName('grid')).toBe('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8');
    });

    it('returns list classes for list view', () => {
      expect(viewClassName('list')).toBe('flex flex-col gap-4 mb-8');
    });

    it('falls back to grid for unknown view', () => {
      expect(viewClassName('unknown')).toBe('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8');
    });
  });

  describe('buildPriceFilterUrl', () => {
    it('builds URL with both min and max', () => {
      expect(buildPriceFilterUrl('', '10', '50')).toBe('/products?priceMin=10&priceMax=50');
    });

    it('omits min when empty', () => {
      expect(buildPriceFilterUrl('?priceMin=99', '', '50')).toBe('/products?priceMax=50');
    });

    it('omits max when empty', () => {
      expect(buildPriceFilterUrl('', '10', '')).toBe('/products?priceMin=10');
    });

    it('preserves existing params', () => {
      expect(buildPriceFilterUrl('?brand=nike', '10', '50')).toBe('/products?brand=nike&priceMin=10&priceMax=50');
    });
  });

  describe('resolveFilterUrl', () => {
    it('returns urlChecked when checked is true', () => {
      expect(resolveFilterUrl(true, '/products?brand=nike', '/products')).toBe('/products?brand=nike');
    });

    it('returns urlUnchecked when checked is false', () => {
      expect(resolveFilterUrl(false, '/products?brand=nike', '/products')).toBe('/products');
    });

    it('returns null when the resolved URL is missing', () => {
      expect(resolveFilterUrl(true, '', '/products')).toBeNull();
      expect(resolveFilterUrl(false, '/products', '')).toBeNull();
    });
  });

  describe('resolveSortUrl', () => {
    const options = [{ dataset: { url: '/products?sort=newest' } }, { dataset: { url: '/products?sort=price-asc' } }, { dataset: {} }];

    it('returns the URL for the selected option', () => {
      expect(resolveSortUrl(1, options)).toBe('/products?sort=price-asc');
    });

    it('returns null when the option has no data-url', () => {
      expect(resolveSortUrl(2, options)).toBeNull();
    });

    it('returns null for an out-of-range index', () => {
      expect(resolveSortUrl(99, options)).toBeNull();
    });
  });

  describe('escapeHtml', () => {
    it('escapes ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a ' + AMP + ' b');
    });

    it('escapes angle brackets', () => {
      expect(escapeHtml('<script>')).toBe(LT + 'script' + GT);
    });

    it('escapes quotes', () => {
      expect(escapeHtml('"hi"')).toBe(QUOT + 'hi' + QUOT);
      expect(escapeHtml("it's")).toBe('it' + APOS + 's');
    });

    it('handles non-string input by coercing to string', () => {
      expect(escapeHtml(42)).toBe('42');
    });
  });

  describe('renderProductCard', () => {
    it('renders a product card with image, name, and price', () => {
      const html = renderProductCard({
        slug: 't-shirt',
        name: 'T-Shirt',
        primaryImageUrl: '/img.jpg',
        priceFormatted: '$29.99',
      });
      expect(html).toContain('href="/products/t-shirt"');
      expect(html).toContain('alt="T-Shirt"');
      expect(html).toContain('src="/img.jpg"');
      expect(html).toContain('$29.99');
    });

    it('omits the image tag when no image URL is provided', () => {
      const html = renderProductCard({ slug: 'item', name: 'Item' });
      expect(html).not.toContain('<img');
    });

    it('escapes malicious input to prevent XSS', () => {
      const html = renderProductCard({
        slug: '"><script>alert(1)</script>',
        name: '<img src=x onerror=alert(1)>',
      });
      // The raw <script> tag must not appear in the output
      expect(html).not.toContain('<script>');
      // The raw <img tag must not appear as a live element
      expect(html).not.toContain('<img');
    });
  });

  describe('renderProductCards', () => {
    it('concatenates multiple product cards', () => {
      const html = renderProductCards([
        { slug: 'a', name: 'A' },
        { slug: 'b', name: 'B' },
      ]);
      expect(html).toContain('href="/products/a"');
      expect(html).toContain('href="/products/b"');
    });

    it('returns empty string for empty array', () => {
      expect(renderProductCards([])).toBe('');
    });

    it('returns empty string for null input', () => {
      expect(renderProductCards(null)).toBe('');
    });
  });
});
