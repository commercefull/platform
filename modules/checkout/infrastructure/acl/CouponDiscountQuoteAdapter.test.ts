import { CouponDiscountQuoteAdapter } from './CouponDiscountQuoteAdapter';
import type { CouponRepository } from '../../../coupon/infrastructure/repositories/CouponRepository';
import type { Coupon } from '../../../coupon/domain/entities/Coupon';

describe('CouponDiscountQuoteAdapter', () => {
  let adapter: CouponDiscountQuoteAdapter;
  let mockCouponRepo: jest.Mocked<Pick<CouponRepository, 'validateCouponCode'>>;

  beforeEach(() => {
    mockCouponRepo = {
      validateCouponCode: jest.fn(),
    };
    adapter = new CouponDiscountQuoteAdapter(mockCouponRepo as unknown as CouponRepository);
  });

  it('implements DiscountQuotePort', () => {
    expect(typeof adapter.validateDiscount).toBe('function');
  });

  it('should return valid quote when coupon is valid', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'SAVE10' } as unknown as Coupon,
      discountAmount: 10,
    });

    const result = await adapter.validateDiscount('SAVE10', 100, 'USD');

    expect(result.valid).toBe(true);
    expect(result.discount).toBeDefined();
    expect(result.discount!.code).toBe('SAVE10');
    expect(result.discount!.discountAmount).toBe(10);
  });

  it('should return invalid result when coupon is invalid', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: false,
      error: 'Coupon expired',
    });

    const result = await adapter.validateDiscount('EXPIRED', 100, 'USD');

    expect(result.valid).toBe(false);
    expect(result.discount).toBeUndefined();
    expect(result.error).toBe('Coupon expired');
  });

  it('should default discountAmount to 0 when not provided', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'FREE' } as unknown as Coupon,
      discountAmount: undefined,
    });

    const result = await adapter.validateDiscount('FREE', 100, 'USD');

    expect(result.valid).toBe(true);
    expect(result.discount!.discountAmount).toBe(0);
  });
});
