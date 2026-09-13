/**
 * Basket processor tests — pure business logic, no DOM required.
 */

import { computeNewQuantity, isDecreaseDisabled, isValidCouponCode, buildRemoveConfirmation } from './processor.js';

describe('Basket processor', () => {
  describe('computeNewQuantity', () => {
    it('increments by 1', () => {
      expect(computeNewQuantity(3, 1)).toBe(4);
    });

    it('decrements by 1', () => {
      expect(computeNewQuantity(3, -1)).toBe(2);
    });

    it('returns -1 when decrementing below 1', () => {
      expect(computeNewQuantity(1, -1)).toBe(-1);
    });

    it('returns -1 when quantity is 0', () => {
      expect(computeNewQuantity(0, -1)).toBe(-1);
    });

    it('handles null currentQuantity', () => {
      expect(computeNewQuantity(null, 1)).toBe(1);
    });
  });

  describe('isDecreaseDisabled', () => {
    it('returns true when quantity is 1', () => {
      expect(isDecreaseDisabled(1)).toBe(true);
    });

    it('returns true when quantity is 0', () => {
      expect(isDecreaseDisabled(0)).toBe(true);
    });

    it('returns false when quantity is 2', () => {
      expect(isDecreaseDisabled(2)).toBe(false);
    });

    it('returns false when quantity is 10', () => {
      expect(isDecreaseDisabled(10)).toBe(false);
    });
  });

  describe('isValidCouponCode', () => {
    it('returns true for a valid code', () => {
      expect(isValidCouponCode('SAVE10')).toBe(true);
    });

    it('returns true for a code with spaces (trimmed)', () => {
      expect(isValidCouponCode('  SAVE10  ')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isValidCouponCode('')).toBe(false);
    });

    it('returns false for whitespace-only string', () => {
      expect(isValidCouponCode('   ')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidCouponCode(null)).toBe(false);
    });
  });

  describe('buildRemoveConfirmation', () => {
    it('builds a confirmation message with the item name', () => {
      expect(buildRemoveConfirmation('Oxford Shirt')).toBe('Remove "Oxford Shirt" from your cart?');
    });

    it('uses fallback for empty name', () => {
      expect(buildRemoveConfirmation('')).toBe('Remove "this item" from your cart?');
    });

    it('uses fallback for null name', () => {
      expect(buildRemoveConfirmation(null)).toBe('Remove "this item" from your cart?');
    });
  });
});
