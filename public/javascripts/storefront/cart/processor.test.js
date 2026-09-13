/**
 * Cart processor tests — pure business logic, no DOM required.
 */

import {
  lineTotal,
  formatPrice,
  calculateSubtotal,
  isCartEmpty,
  escapeHtml,
  renderEmptyCart,
  renderCartItem,
  renderCartItems,
} from './processor.js';

describe('Cart processor', () => {
  describe('lineTotal', () => {
    it('calculates price * quantity', () => {
      expect(lineTotal({ price: '10.00', quantity: 2 })).toBe(20);
    });

    it('handles numeric price', () => {
      expect(lineTotal({ price: 15.5, quantity: 3 })).toBe(46.5);
    });

    it('returns 0 for invalid price', () => {
      expect(lineTotal({ price: 'abc', quantity: 2 })).toBe(0);
    });

    it('returns 0 for invalid quantity', () => {
      expect(lineTotal({ price: '10.00', quantity: 'abc' })).toBe(0);
    });
  });

  describe('formatPrice', () => {
    it('formats a number as USD', () => {
      expect(formatPrice(12.5)).toBe('$12.50');
    });

    it('formats 0 as $0.00', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('handles NaN input', () => {
      expect(formatPrice(NaN)).toBe('$0.00');
    });
  });

  describe('calculateSubtotal', () => {
    it('sums line totals', () => {
      const items = [
        { price: '10.00', quantity: 2 },
        { price: '5.00', quantity: 1 },
      ];
      expect(calculateSubtotal(items)).toBe(25);
    });

    it('returns 0 for empty array', () => {
      expect(calculateSubtotal([])).toBe(0);
    });

    it('returns 0 for null input', () => {
      expect(calculateSubtotal(null)).toBe(0);
    });
  });

  describe('isCartEmpty', () => {
    it('returns true for null cart', () => {
      expect(isCartEmpty(null)).toBe(true);
    });

    it('returns true for cart with empty items', () => {
      expect(isCartEmpty({ items: [] })).toBe(true);
    });

    it('returns false for cart with items', () => {
      expect(isCartEmpty({ items: [{ name: 'A' }] })).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    it('escapes special characters', () => {
      const result = escapeHtml('<script>alert("&")</script>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });
  });

  describe('renderEmptyCart', () => {
    it('contains the empty cart message', () => {
      const html = renderEmptyCart();
      expect(html).toContain('Your cart is empty');
    });
  });

  describe('renderCartItem', () => {
    it('renders item with name, quantity, and price', () => {
      const html = renderCartItem({ name: 'T-Shirt', quantity: 2, price: '25.00' });
      expect(html).toContain('T-Shirt');
      expect(html).toContain('Qty: 2');
      expect(html).toContain('$50.00');
    });

    it('includes image when provided', () => {
      const html = renderCartItem({ name: 'Item', quantity: 1, price: '10', image: '/img.jpg' });
      expect(html).toContain('src="/img.jpg"');
    });

    it('omits image when not provided', () => {
      const html = renderCartItem({ name: 'Item', quantity: 1, price: '10' });
      expect(html).not.toContain('<img');
    });

    it('escapes malicious name', () => {
      const html = renderCartItem({ name: '<script>x</script>', quantity: 1, price: '10' });
      expect(html).not.toContain('<script>');
    });
  });

  describe('renderCartItems', () => {
    it('concatenates multiple items', () => {
      const html = renderCartItems([
        { name: 'A', quantity: 1, price: '10' },
        { name: 'B', quantity: 2, price: '5' },
      ]);
      expect(html).toContain('A');
      expect(html).toContain('B');
    });

    it('returns empty string for empty array', () => {
      expect(renderCartItems([])).toBe('');
    });
  });
});
