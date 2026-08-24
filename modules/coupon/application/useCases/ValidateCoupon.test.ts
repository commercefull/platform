/**
 * Unit Tests for ValidateCoupon Use Case
 */

import { ValidateCouponUseCase, ValidateCouponCommand } from './ValidateCoupon';
import { Coupon } from '../../domain/entities/Coupon';

describe('ValidateCouponUseCase', () => {
  let useCase: ValidateCouponUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      validateCouponCode: jest.fn(),
    };
    useCase = new ValidateCouponUseCase(mockRepo as never as ConstructorParameters<typeof ValidateCouponUseCase>[0]);
  });

  function createCoupon(): Coupon {
    return Coupon.create({
      couponId: 'c-1',
      code: 'SAVE10',
      name: 'Save 10%',
      type: 'percentage',
      value: 10,
      usageType: 'multi_use',
      usageLimit: 100,
      createdBy: 'admin',
    });
  }

  it('should return valid result when coupon is valid', async () => {
    const coupon = createCoupon();
    mockRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon,
      discountAmount: 10,
    });

    const result = await useCase.execute(
      new ValidateCouponCommand('SAVE10', 100, 'cust-1'),
    );

    expect(result.valid).toBe(true);
    expect(result.coupon!.couponId).toBe('c-1');
    expect(result.coupon!.code).toBe('SAVE10');
    expect(result.coupon!.discountAmount).toBe(10);
  });

  it('should return invalid when repo returns invalid', async () => {
    mockRepo.validateCouponCode.mockResolvedValue({
      valid: false,
      error: 'Coupon expired',
    });

    const result = await useCase.execute(
      new ValidateCouponCommand('EXPIRED', 100),
    );

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Coupon expired');
  });

  it('should return invalid with default error when no error provided', async () => {
    mockRepo.validateCouponCode.mockResolvedValue({ valid: false });

    const result = await useCase.execute(
      new ValidateCouponCommand('UNKNOWN', 100),
    );

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid coupon');
  });

  it('should calculate item-level discounts for applicable products', async () => {
    const coupon = Coupon.create({
      couponId: 'c-1',
      code: 'SAVE10',
      name: 'Save 10%',
      type: 'percentage',
      value: 10,
      usageType: 'multi_use',
      usageLimit: 100,
      applicableProducts: ['prod-1', 'prod-2'],
      createdBy: 'admin',
    });
    mockRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon,
      discountAmount: 10,
    });

    const result = await useCase.execute(
      new ValidateCouponCommand('SAVE10', 100, 'cust-1', [
        { productId: 'prod-1', quantity: 2, price: 20 },
        { productId: 'prod-3', quantity: 1, price: 50 },
      ]),
    );

    expect(result.applicableItems).toBeDefined();
    expect(result.applicableItems).toHaveLength(1);
    expect(result.applicableItems![0].productId).toBe('prod-1');
    expect(result.applicableItems![0].discountAmount).toBe(4); // 10% of 40
  });

  it('should not return applicableItems when no items provided', async () => {
    const coupon = createCoupon();
    mockRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon,
      discountAmount: 10,
    });

    const result = await useCase.execute(
      new ValidateCouponCommand('SAVE10', 100),
    );

    expect(result.applicableItems).toBeUndefined();
  });
});
