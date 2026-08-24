/**
 * Unit Tests for Coupon Entity
 */

import { Coupon } from './Coupon';
import { CouponValidationError } from '../errors/CouponErrors';

describe('Coupon', () => {
  function createCoupon(overrides?: Record<string, unknown>): Coupon {
    return Coupon.create({
      couponId: 'c-1',
      code: '  save10  ',
      name: 'Save 10%',
      type: 'percentage',
      value: 10,
      usageType: 'multi_use',
      usageLimit: 100,
      createdBy: 'admin-1',
      ...overrides,
    });
  }

  describe('create', () => {
    it('should create with uppercase code and defaults', () => {
      const c = createCoupon();

      expect(c.couponId).toBe('c-1');
      expect(c.code).toBe('SAVE10');
      expect(c.name).toBe('Save 10%');
      expect(c.isActive).toBe(true);
      expect(c.usageCount).toBe(0);
      expect(c.conditions).toHaveLength(0);
    });

    it('should throw when code is empty', () => {
      expect(() => createCoupon({ code: '  ' })).toThrow(CouponValidationError);
    });

    it('should throw when percentage value is out of range', () => {
      expect(() => createCoupon({ value: 150 })).toThrow(CouponValidationError);
      expect(() => createCoupon({ value: -5 })).toThrow(CouponValidationError);
    });

    it('should throw when fixed_amount has no currency', () => {
      expect(() => createCoupon({ type: 'fixed_amount', value: 10, currency: undefined })).toThrow(CouponValidationError);
    });

    it('should throw when multi_use has no usageLimit', () => {
      expect(() => createCoupon({ usageType: 'multi_use', usageLimit: undefined })).toThrow(CouponValidationError);
    });

    it('should create fixed_amount with currency', () => {
      const c = createCoupon({ type: 'fixed_amount', value: 5, currency: 'USD' });

      expect(c.type).toBe('fixed_amount');
      expect(c.currency).toBe('USD');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const c = Coupon.reconstitute({
        couponId: 'c-1',
        code: 'TEST',
        name: 'Test',
        type: 'percentage',
        value: 10,
        usageType: 'unlimited',
        usageCount: 5,
        conditions: [],
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(c.code).toBe('TEST');
      expect(c.usageCount).toBe(5);
    });
  });

  describe('computed properties', () => {
    it('status should be active for valid coupon', () => {
      const c = createCoupon();
      expect(c.status).toBe('active');
    });

    it('status should be inactive when isActive is false', () => {
      const c = Coupon.reconstitute({
        couponId: 'c-1', code: 'T', name: 'T', type: 'percentage', value: 10,
        usageType: 'unlimited', usageCount: 0, conditions: [], isActive: false,
        createdBy: 'a', createdAt: new Date(), updatedAt: new Date(),
      });
      expect(c.status).toBe('inactive');
    });

    it('isExpired should be true when expiresAt is in the past', () => {
      const c = Coupon.reconstitute({
        couponId: 'c-1', code: 'T', name: 'T', type: 'percentage', value: 10,
        usageType: 'unlimited', usageCount: 0, conditions: [], isActive: true,
        expiresAt: new Date('2020-01-01'),
        createdBy: 'a', createdAt: new Date(), updatedAt: new Date(),
      });
      expect(c.isExpired).toBe(true);
    });

    it('isDepleted should be true for single_use with usageCount >= 1', () => {
      const c = Coupon.reconstitute({
        couponId: 'c-1', code: 'T', name: 'T', type: 'percentage', value: 10,
        usageType: 'single_use', usageCount: 1, conditions: [], isActive: true,
        createdBy: 'a', createdAt: new Date(), updatedAt: new Date(),
      });
      expect(c.isDepleted).toBe(true);
    });

    it('isDepleted should be false for unlimited', () => {
      const c = createCoupon({ usageType: 'unlimited', usageLimit: undefined });
      expect(c.isDepleted).toBe(false);
    });

    it('remainingUses should be undefined for unlimited', () => {
      const c = createCoupon({ usageType: 'unlimited', usageLimit: undefined });
      expect(c.remainingUses).toBeUndefined();
    });

    it('remainingUses should calculate for multi_use', () => {
      const c = Coupon.reconstitute({
        couponId: 'c-1', code: 'T', name: 'T', type: 'percentage', value: 10,
        usageType: 'multi_use', usageLimit: 100, usageCount: 30, conditions: [], isActive: true,
        createdBy: 'a', createdAt: new Date(), updatedAt: new Date(),
      });
      expect(c.remainingUses).toBe(70);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate percentage discount', () => {
      const c = createCoupon({ type: 'percentage', value: 15 });
      expect(c.calculateDiscount(100)).toBe(15);
    });

    it('should calculate fixed amount discount', () => {
      const c = createCoupon({ type: 'fixed_amount', value: 5, currency: 'USD' });
      expect(c.calculateDiscount(100)).toBe(5);
    });

    it('should return 0 for free_shipping', () => {
      const c = createCoupon({ type: 'free_shipping', value: 0 });
      expect(c.calculateDiscount(100)).toBe(0);
    });

    it('should cap at maxDiscountAmount', () => {
      const c = createCoupon({ type: 'percentage', value: 50, maxDiscountAmount: 20 });
      expect(c.calculateDiscount(100)).toBe(20);
    });
  });

  describe('canBeApplied', () => {
    it('should return true for active coupon with no minimum', () => {
      const c = createCoupon();
      expect(c.canBeApplied(100)).toBe(true);
    });

    it('should return false when order value below minimum', () => {
      const c = createCoupon({ minOrderValue: 50 });
      expect(c.canBeApplied(30)).toBe(false);
    });

    it('should return false when coupon is not active status', () => {
      const c = Coupon.reconstitute({
        couponId: 'c-1', code: 'T', name: 'T', type: 'percentage', value: 10,
        usageType: 'unlimited', usageCount: 0, conditions: [], isActive: false,
        createdBy: 'a', createdAt: new Date(), updatedAt: new Date(),
      });
      expect(c.canBeApplied(100)).toBe(false);
    });
  });

  describe('recordUsage', () => {
    it('should increment usageCount and return usage record', () => {
      const c = createCoupon();
      const usage = c.recordUsage('ord-1', 'cust-1', 10);

      expect(c.usageCount).toBe(1);
      expect(usage.orderId).toBe('ord-1');
      expect(usage.customerId).toBe('cust-1');
      expect(usage.discountAmount).toBe(10);
      expect(usage.usageId).toBeDefined();
    });
  });

  describe('updateBasicInfo', () => {
    it('should update name and description', () => {
      const c = createCoupon();
      c.updateBasicInfo({ name: 'New Name', description: 'New desc' });

      expect(c.name).toBe('New Name');
      expect(c.description).toBe('New desc');
    });

    it('should toggle isActive', () => {
      const c = createCoupon();
      c.updateBasicInfo({ isActive: false });

      expect(c.isActive).toBe(false);
    });
  });

  describe('addCondition / removeCondition', () => {
    it('should add and remove conditions', () => {
      const c = createCoupon();
      c.addCondition({ type: 'min_order_value', operator: 'greater_than', value: 50 });
      expect(c.conditions).toHaveLength(1);

      c.removeCondition(0);
      expect(c.conditions).toHaveLength(0);
    });
  });

  describe('toJSON', () => {
    it('should return serialized object', () => {
      const c = createCoupon();
      const json = c.toJSON();

      expect(json.couponId).toBe('c-1');
      expect(json.code).toBe('SAVE10');
      expect(json.status).toBe('active');
    });
  });
});
