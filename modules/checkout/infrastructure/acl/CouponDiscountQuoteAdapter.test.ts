import { CouponDiscountQuoteAdapter } from './CouponDiscountQuoteAdapter';
import type { CouponRepository } from '../../../coupon/infrastructure/repositories/CouponRepository';
import type { CouponPromotionGate } from '../../../coupon/infrastructure/acl/CouponPromotionGate';
import type { Coupon } from '../../../coupon/domain/entities/Coupon';

describe('CouponDiscountQuoteAdapter', () => {
  let adapter: CouponDiscountQuoteAdapter;
  let mockCouponRepo: jest.Mocked<Pick<CouponRepository, 'validateCouponCode'>>;
  let mockGate: jest.Mocked<Pick<CouponPromotionGate, 'isEligible'>>;

  beforeEach(() => {
    mockCouponRepo = {
      validateCouponCode: jest.fn(),
    };
    mockGate = {
      isEligible: jest.fn(),
    };
    adapter = new CouponDiscountQuoteAdapter(mockCouponRepo as unknown as CouponRepository, mockGate as unknown as CouponPromotionGate);
  });

  it('implements DiscountQuotePort', () => {
    expect(typeof adapter.validateDiscount).toBe('function');
  });

  it('should return valid quote when coupon is valid', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'SAVE10' } as unknown as Coupon,
      discountAmountCents: 10,
    });

    const result = await adapter.validateDiscount('SAVE10', 100, 'USD');

    expect(result.valid).toBe(true);
    expect(result.discount).toBeDefined();
    expect(result.discount!.code).toBe('SAVE10');
    expect(result.discount!.discountAmountCents).toBe(10);
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

  it('should default discountAmountCents to 0 when not provided', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'FREE' } as unknown as Coupon,
      discountAmountCents: undefined,
    });

    const result = await adapter.validateDiscount('FREE', 100, 'USD');

    expect(result.valid).toBe(true);
    expect(result.discount!.discountAmountCents).toBe(0);
  });

  it('should pass customer and organization context to coupon repository', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'SAVE10' } as unknown as Coupon,
      discountAmountCents: 10,
    });

    await adapter.validateDiscount('SAVE10', 100, 'USD', { customerId: 'cust-1', organizationId: 'org-1' });

    expect(mockCouponRepo.validateCouponCode).toHaveBeenCalledWith('SAVE10', 100, 'cust-1', 'org-1');
  });

  it('should reject the coupon when the linked promotion does not match the channel', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'FB10', promotionId: 'promo-1' } as unknown as Coupon,
      discountAmountCents: 10,
    });
    mockGate.isEligible.mockResolvedValue({
      eligible: false,
      reason: 'Coupon is not eligible for this store, channel, country, or currency',
    });

    const result = await adapter.validateDiscount('FB10', 100, 'USD', { channelId: 'ch-web', storeId: 'store-1' });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('not eligible');
    expect(mockGate.isEligible).toHaveBeenCalledWith(
      'promo-1',
      expect.objectContaining({ subtotalCents: 100, currency: 'USD', channelId: 'ch-web', storeId: 'store-1' }),
    );
  });

  it('should not invoke the promotion gate for coupons without a linked promotion', async () => {
    mockCouponRepo.validateCouponCode.mockResolvedValue({
      valid: true,
      coupon: { code: 'SAVE10' } as unknown as Coupon,
      discountAmountCents: 10,
    });

    const result = await adapter.validateDiscount('SAVE10', 100, 'USD', { channelId: 'ch-web' });

    expect(result.valid).toBe(true);
    expect(mockGate.isEligible).not.toHaveBeenCalled();
  });
});
