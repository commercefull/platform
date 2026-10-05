import { ApplyLoyaltyRewardCommand, ApplyLoyaltyRewardUseCase } from './ApplyLoyaltyReward';
import { RemoveLoyaltyRewardCommand, RemoveLoyaltyRewardUseCase } from './RemoveLoyaltyReward';
import { createCheckoutRepository, createCheckoutSession, createLoyaltyQuotePort, createAddress } from '../../tests/testUtils';
import { Money } from '../../../../libs/money';
import { BadRequestError, NotFoundError } from '../../../../libs/errors';

describe('ApplyLoyaltyRewardUseCase', () => {
  const readySession = () =>
    createCheckoutSession({
      customerId: 'cust-1',
      subtotal: Money.create(100, 'USD'),
      total: Money.create(100, 'USD'),
      shippingAddress: createAddress(),
      shippingMethodId: 'ship-1',
      paymentMethodId: 'pm-1',
    });

  it('should apply a fixed-value reward and reduce the total', async () => {
    const repository = createCheckoutRepository();
    const loyaltyQuote = createLoyaltyQuotePort();
    const session = readySession();
    repository.findById.mockResolvedValue(session);
    loyaltyQuote.getReward.mockResolvedValue({
      rewardId: 'rw-1',
      name: '$5 off',
      pointsCost: 500,
      value: 500,
      valueType: 'fixed',
      isActive: true,
    });
    loyaltyQuote.getPointsBalance.mockResolvedValue(1200);

    const result = await new ApplyLoyaltyRewardUseCase(repository, loyaltyQuote).execute(new ApplyLoyaltyRewardCommand('ck-1', 'rw-1'));

    expect(result.loyaltyRewardId).toBe('rw-1');
    expect(result.loyaltyPointsRedeemed).toBe(500);
    expect(result.loyaltyDiscountAmountCents).toBe(500);
    expect(result.totalCents).toBe(9500);
    expect(repository.save).toHaveBeenCalledWith(session);
  });

  it('should apply a percentage reward on the post-coupon subtotal', async () => {
    const repository = createCheckoutRepository();
    const loyaltyQuote = createLoyaltyQuotePort();
    const session = readySession();
    session.applyCoupon('SAVE10', Money.create(20, 'USD'));
    repository.findById.mockResolvedValue(session);
    loyaltyQuote.getReward.mockResolvedValue({
      rewardId: 'rw-2',
      name: '15% off',
      pointsCost: 1500,
      value: 15,
      valueType: 'percentage',
      isActive: true,
    });
    loyaltyQuote.getPointsBalance.mockResolvedValue(2000);

    const result = await new ApplyLoyaltyRewardUseCase(repository, loyaltyQuote).execute(new ApplyLoyaltyRewardCommand('ck-1', 'rw-2'));

    // 15% of ($100 - $20 coupon) = $12 → total $100 - $20 - $12 = $68
    expect(result.loyaltyDiscountAmountCents).toBe(1200);
    expect(result.totalCents).toBe(6800);
  });

  it('should reject when the customer is not authenticated', async () => {
    const repository = createCheckoutRepository();
    const loyaltyQuote = createLoyaltyQuotePort();
    repository.findById.mockResolvedValue(createCheckoutSession({ guestEmail: 'g@x.com' }));

    await expect(
      new ApplyLoyaltyRewardUseCase(repository, loyaltyQuote).execute(new ApplyLoyaltyRewardCommand('ck-1', 'rw-1')),
    ).rejects.toThrow(BadRequestError);
    expect(loyaltyQuote.getReward).not.toHaveBeenCalled();
  });

  it('should reject an inactive or unknown reward', async () => {
    const repository = createCheckoutRepository();
    const loyaltyQuote = createLoyaltyQuotePort();
    repository.findById.mockResolvedValue(readySession());
    loyaltyQuote.getReward.mockResolvedValue({
      rewardId: 'rw-1',
      name: 'x',
      pointsCost: 100,
      value: 100,
      valueType: 'fixed',
      isActive: false,
    });

    await expect(
      new ApplyLoyaltyRewardUseCase(repository, loyaltyQuote).execute(new ApplyLoyaltyRewardCommand('ck-1', 'rw-1')),
    ).rejects.toThrow(BadRequestError);

    loyaltyQuote.getReward.mockResolvedValue(null);
    await expect(
      new ApplyLoyaltyRewardUseCase(repository, loyaltyQuote).execute(new ApplyLoyaltyRewardCommand('ck-1', 'rw-9')),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when the balance is insufficient', async () => {
    const repository = createCheckoutRepository();
    const loyaltyQuote = createLoyaltyQuotePort();
    repository.findById.mockResolvedValue(readySession());
    loyaltyQuote.getReward.mockResolvedValue({
      rewardId: 'rw-1',
      name: '$5 off',
      pointsCost: 500,
      value: 500,
      valueType: 'fixed',
      isActive: true,
    });
    loyaltyQuote.getPointsBalance.mockResolvedValue(100);

    await expect(
      new ApplyLoyaltyRewardUseCase(repository, loyaltyQuote).execute(new ApplyLoyaltyRewardCommand('ck-1', 'rw-1')),
    ).rejects.toThrow(BadRequestError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should reject non-members', async () => {
    const repository = createCheckoutRepository();
    const loyaltyQuote = createLoyaltyQuotePort();
    repository.findById.mockResolvedValue(readySession());
    loyaltyQuote.getReward.mockResolvedValue({
      rewardId: 'rw-1',
      name: '$5 off',
      pointsCost: 500,
      value: 500,
      valueType: 'fixed',
      isActive: true,
    });
    loyaltyQuote.getPointsBalance.mockResolvedValue(null);

    await expect(
      new ApplyLoyaltyRewardUseCase(repository, loyaltyQuote).execute(new ApplyLoyaltyRewardCommand('ck-1', 'rw-1')),
    ).rejects.toThrow(BadRequestError);
  });

  it('should cap the discount at the remaining payable amount', async () => {
    const repository = createCheckoutRepository();
    const loyaltyQuote = createLoyaltyQuotePort();
    const session = createCheckoutSession({
      customerId: 'cust-1',
      subtotal: Money.create(3, 'USD'),
      total: Money.create(3, 'USD'),
    });
    repository.findById.mockResolvedValue(session);
    loyaltyQuote.getReward.mockResolvedValue({
      rewardId: 'rw-1',
      name: '$5 off',
      pointsCost: 500,
      value: 500,
      valueType: 'fixed',
      isActive: true,
    });
    loyaltyQuote.getPointsBalance.mockResolvedValue(900);

    const result = await new ApplyLoyaltyRewardUseCase(repository, loyaltyQuote).execute(new ApplyLoyaltyRewardCommand('ck-1', 'rw-1'));

    expect(result.loyaltyDiscountAmountCents).toBe(300);
    expect(result.totalCents).toBe(0);
  });

  it('should throw NotFoundError for a missing session', async () => {
    const repository = createCheckoutRepository();
    repository.findById.mockResolvedValue(null);

    await expect(
      new ApplyLoyaltyRewardUseCase(repository, createLoyaltyQuotePort()).execute(new ApplyLoyaltyRewardCommand('missing', 'rw-1')),
    ).rejects.toThrow(NotFoundError);
  });
});

describe('RemoveLoyaltyRewardUseCase', () => {
  it('should clear the reward and restore the total', async () => {
    const repository = createCheckoutRepository();
    const session = createCheckoutSession({
      customerId: 'cust-1',
      subtotal: Money.create(100, 'USD'),
      total: Money.create(100, 'USD'),
    });
    session.applyLoyaltyReward('rw-1', 500, Money.create(5, 'USD'));
    repository.findById.mockResolvedValue(session);

    const result = await new RemoveLoyaltyRewardUseCase(repository).execute(new RemoveLoyaltyRewardCommand('ck-1'));

    expect(result.loyaltyRewardId).toBeUndefined();
    expect(result.loyaltyDiscountAmountCents).toBeUndefined();
    expect(result.totalCents).toBe(10000);
    expect(repository.save).toHaveBeenCalledWith(session);
  });

  it('should throw NotFoundError for a missing session', async () => {
    const repository = createCheckoutRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new RemoveLoyaltyRewardUseCase(repository).execute(new RemoveLoyaltyRewardCommand('missing'))).rejects.toThrow(
      NotFoundError,
    );
  });
});
