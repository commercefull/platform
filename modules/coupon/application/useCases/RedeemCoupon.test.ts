import { createCoupon, createCouponRepository, emitMock, COUPON_ID } from '../../tests/testUtils';
import { RedeemCouponUseCase } from './RedeemCoupon';
import { CouponNotFoundError } from '../../domain/errors/CouponErrors';

describe('RedeemCouponUseCase', () => {
  it('should record the redemption when the coupon exists', async () => {
    const repository = createCouponRepository(createCoupon());

    const result = await new RedeemCouponUseCase(repository).execute({
      couponCode: 'SAVE10',
      orderId: 'order-1',
      customerId: 'customer-1',
      discountAmountCents: 10,
    });

    expect(result.redeemed).toBe(true);
    expect(result.redemptionId).toBe('test-uuid');
    expect(repository.createRedemption).toHaveBeenCalledWith(
      expect.objectContaining({ couponId: COUPON_ID, orderId: 'order-1', discountAmountCents: 10 }),
    );
    expect(repository.incrementUsageCount).toHaveBeenCalledWith(COUPON_ID);
  });

  it('should emit promotion.coupon_redeemed when the coupon is redeemed', async () => {
    const repository = createCouponRepository(createCoupon());

    await new RedeemCouponUseCase(repository).execute({
      couponCode: 'SAVE10',
      orderId: 'order-1',
      customerId: 'customer-1',
      discountAmountCents: 10,
    });

    expect(emitMock).toHaveBeenCalledWith(
      'promotion.coupon_redeemed',
      expect.objectContaining({ couponId: COUPON_ID, couponCode: 'SAVE10', orderId: 'order-1', discountAmountCents: 10 }),
    );
  });

  it('should return the existing redemption without re-counting usage when the order already redeemed it', async () => {
    const repository = createCouponRepository(createCoupon());
    repository.findRedemptionByOrder.mockResolvedValue({
      redemptionId: 'redemption-existing',
      redeemedAt: new Date('2026-10-01T12:00:00Z'),
    });

    const result = await new RedeemCouponUseCase(repository).execute({
      couponCode: 'SAVE10',
      orderId: 'order-1',
      customerId: 'customer-1',
      discountAmountCents: 10,
    });

    expect(result.redeemed).toBe(true);
    expect(result.redemptionId).toBe('redemption-existing');
    expect(result.redeemedAt).toBe('2026-10-01T12:00:00.000Z');
    expect(repository.findRedemptionByOrder).toHaveBeenCalledWith(COUPON_ID, 'order-1');
    expect(repository.createRedemption).not.toHaveBeenCalled();
    expect(repository.incrementUsageCount).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalledWith('promotion.coupon_redeemed', expect.anything());
  });

  it('should return the concurrent winner when the insert loses the unique-index race', async () => {
    const repository = createCouponRepository(createCoupon());
    repository.findRedemptionByOrder
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ redemptionId: 'redemption-winner', redeemedAt: new Date('2026-10-01T12:00:00Z') });
    repository.createRedemption.mockResolvedValue(false);

    const result = await new RedeemCouponUseCase(repository).execute({
      couponCode: 'SAVE10',
      orderId: 'order-1',
      customerId: 'customer-1',
      discountAmountCents: 10,
    });

    expect(result.redemptionId).toBe('redemption-winner');
    expect(repository.incrementUsageCount).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalledWith('promotion.coupon_redeemed', expect.anything());
  });

  it('should throw CouponNotFoundError when the coupon does not exist', async () => {
    const repository = createCouponRepository(null);

    await expect(
      new RedeemCouponUseCase(repository).execute({ couponCode: 'MISSING', orderId: 'order-1', discountAmountCents: 10 }),
    ).rejects.toThrow(CouponNotFoundError);
    expect(repository.createRedemption).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
