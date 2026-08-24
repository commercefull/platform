jest.mock('../../infrastructure/repositories/GiftCardRepository', () => ({
  getGiftCardByCode: jest.fn().mockResolvedValue({
    promotionGiftCardId: 'gc1', code: 'GIFT100', currentBalance: 100, currency: 'USD',
    status: 'active', expiresAt: null, isReloadable: true,
  }),
  getGiftCard: jest.fn().mockResolvedValue({
    promotionGiftCardId: 'gc1', code: 'GIFT100', currentBalance: 50, currency: 'USD',
    status: 'active', expiresAt: null, isReloadable: true,
  }),
  redeemGiftCard: jest.fn().mockResolvedValue({
    promotionGiftCardTransactionId: 't1', promotionGiftCardId: 'gc1', amount: 50, type: 'redemption',
  }),
}));

import { RedeemGiftCardUseCase, RedeemGiftCardCommand } from './RedeemGiftCard';
import * as giftCardRepo from '../../infrastructure/repositories/GiftCardRepository';

describe('RedeemGiftCardUseCase', () => {
  let useCase: RedeemGiftCardUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RedeemGiftCardUseCase();
  });

  it('should redeem gift card (happy path)', async () => {
    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT100', 50, 'o1', 'c1'));

    expect(result.success).toBe(true);
    expect(result.transaction?.promotionGiftCardTransactionId).toBe('t1');
  });

  it('should return error when code is empty', async () => {
    const result = await useCase.execute(new RedeemGiftCardCommand('', 50));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('code_required');
  });

  it('should return error when amount is not positive', async () => {
    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT100', 0));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('invalid_amount');
  });

  it('should return error when gift card not found', async () => {
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValueOnce(null);

    const result = await useCase.execute(new RedeemGiftCardCommand('NONEXISTENT', 50));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_not_found');
  });

  it('should return error when gift card is not active', async () => {
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValueOnce({
      giftCardId: 'gc1', code: 'GIFT100', currentBalance: 100, status: 'inactive', expiresAt: null,
    });

    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT100', 50));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_not_active');
  });

  it('should return error when insufficient balance', async () => {
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValueOnce({
      promotionGiftCardId: 'gc1', code: 'GIFT100', currentBalance: 30, status: 'active', expiresAt: null,
    });

    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT100', 50));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('insufficient_balance');
  });
});
