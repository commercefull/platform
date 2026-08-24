jest.mock('../../infrastructure/repositories/GiftCardRepository', () => ({
  getGiftCardByCode: jest.fn().mockResolvedValue({
    giftCardId: 'gc1', code: 'GIFT100', currentBalance: 100, currency: 'USD',
    status: 'active', expiresAt: null, isReloadable: true,
  }),
}));

import { CheckGiftCardBalanceUseCase, CheckGiftCardBalanceQuery } from './CheckGiftCardBalance';
import * as giftCardRepo from '../../infrastructure/repositories/GiftCardRepository';

describe('CheckGiftCardBalanceUseCase', () => {
  let useCase: CheckGiftCardBalanceUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CheckGiftCardBalanceUseCase();
  });

  it('should check balance (happy path)', async () => {
    const result = await useCase.execute(new CheckGiftCardBalanceQuery('GIFT100'));

    expect(result.success).toBe(true);
    expect(result.currentBalance).toBe(100);
    expect(result.status).toBe('active');
  });

  it('should return error when code is empty', async () => {
    const result = await useCase.execute(new CheckGiftCardBalanceQuery(''));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('code_required');
  });

  it('should return error when gift card not found', async () => {
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValueOnce(null);

    const result = await useCase.execute(new CheckGiftCardBalanceQuery('NONEXISTENT'));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_not_found');
  });

  it('should report expired status', async () => {
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValueOnce({
      promotionGiftCardId: 'gc1', code: 'EXPIRED', currentBalance: 50, currency: 'USD',
      status: 'active', expiresAt: new Date('2020-01-01'), isReloadable: false,
    });

    const result = await useCase.execute(new CheckGiftCardBalanceQuery('EXPIRED'));

    expect(result.success).toBe(true);
    expect(result.status).toBe('expired');
  });
});
