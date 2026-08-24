/* eslint-disable @typescript-eslint/no-require-imports */

describe('CouponDiscountQuoteAdapter', () => {
  let adapter: import('./CouponDiscountQuoteAdapter').CouponDiscountQuoteAdapter;
  let mockCouponRepo: { validateCouponCode: jest.Mock };

  beforeEach(() => {
    mockCouponRepo = {
      validateCouponCode: jest.fn(),
    };
    const { CouponDiscountQuoteAdapter } = require('./CouponDiscountQuoteAdapter');
    adapter = new CouponDiscountQuoteAdapter(mockCouponRepo as never);
  });

  it('implements DiscountQuotePort', () => {
    expect(typeof adapter.validateDiscount).toBe('function');
  });

  it('should return valid quote when coupon is valid', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'SAVE10', type: 'fixed_amount', value: 10 },
      discountAmount: 10,
    });

    const result = await adapter.validateDiscount('SAVE10', 100, 'cust-1');

    expect(result.valid).toBe(true);
    expect(result.discount).toBeDefined();
    expect(result.discount!.code).toBe('SAVE10');
    expect(result.discount!.type).toBe('fixed_amount');
    expect(result.discount!.value).toBe(10);
    expect(result.discount!.discountAmount).toBe(10);
  });

  it('should return invalid result when coupon is invalid', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: false,
      error: 'Coupon expired',
    });

    const result = await adapter.validateDiscount('EXPIRED', 100, 'cust-1');

    expect(result.valid).toBe(false);
    expect(result.discount).toBeUndefined();
    expect(result.error).toBe('Coupon expired');
  });

  it('should default discountAmount to 0 when not provided', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'FREE', type: 'percentage', value: 50 },
      discountAmount: undefined,
    });

    const result = await adapter.validateDiscount('FREE', 100);

    expect(result.valid).toBe(true);
    expect(result.discount!.discountAmount).toBe(0);
  });

  it('should pass customerId to coupon repository', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'SAVE10', type: 'fixed_amount', value: 10 },
      discountAmount: 10,
    });

    await adapter.validateDiscount('SAVE10', 100, 'cust-1');

    expect(mockCouponRepo.validateCouponCode).toHaveBeenCalledWith('SAVE10', 100, 'cust-1');
  });

  it('should work without customerId', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'SAVE10', type: 'percentage', value: 20 },
      discountAmount: 20,
    });

    const result = await adapter.validateDiscount('SAVE10', 100);

    expect(result.valid).toBe(true);
    expect(mockCouponRepo.validateCouponCode).toHaveBeenCalledWith('SAVE10', 100, undefined);
  });

  it('should propagate errors from coupon repository', async () => {
    mockCouponRepo.validateCouponCode.mockRejectedValue(new Error('DB error'));

    await expect(adapter.validateDiscount('SAVE10', 100)).rejects.toThrow('DB error');
  });
});
