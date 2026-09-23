import '../../tests/testUtils';
import { RedeemGiftCardUseCase, RedeemGiftCardCommand } from './RedeemGiftCard';
import { createRedeemGiftCardRepository, createGiftCard, createGiftCardTransaction } from '../../tests/testUtils';

describe('RedeemGiftCardUseCase', () => {
  const giftCardRepository = createRedeemGiftCardRepository();
  const useCase = new RedeemGiftCardUseCase(giftCardRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepository.getGiftCardByCode.mockResolvedValue(createGiftCard());
    giftCardRepository.redeemGiftCard.mockResolvedValue(createGiftCardTransaction());
    giftCardRepository.getGiftCard.mockResolvedValue(createGiftCard({ currentBalance: 75 }));
  });

  it('should redeem the amount and return the remaining balance when the card is valid', async () => {
    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT1234', 25, 'order-1', 'cust-1'));

    expect(result.success).toBe(true);
    expect(result.transaction?.promotionGiftCardTransactionId).toBe('txn-1');
    expect(result.remainingBalance).toBe(75);
    expect(giftCardRepository.redeemGiftCard).toHaveBeenCalledWith('gc-1', 25, 'order-1', 'cust-1');
  });

  it('should return code_required when the code is empty', async () => {
    const result = await useCase.execute(new RedeemGiftCardCommand('', 25));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('code_required');
    expect(giftCardRepository.redeemGiftCard).not.toHaveBeenCalled();
  });

  it('should return invalid_amount when the amount is not positive', async () => {
    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT1234', 0));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('invalid_amount');
    expect(giftCardRepository.redeemGiftCard).not.toHaveBeenCalled();
  });

  it('should return gift_card_not_found when the code does not exist', async () => {
    giftCardRepository.getGiftCardByCode.mockResolvedValue(null);

    const result = await useCase.execute(new RedeemGiftCardCommand('UNKNOWN', 25));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_not_found');
  });

  it('should return gift_card_not_active when the card is not active', async () => {
    giftCardRepository.getGiftCardByCode.mockResolvedValue(createGiftCard({ status: 'cancelled' }));

    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT1234', 25));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_not_active');
  });

  it('should return gift_card_expired when the expiry date has passed', async () => {
    giftCardRepository.getGiftCardByCode.mockResolvedValue(createGiftCard({ expiresAt: new Date('2020-01-01') }));

    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT1234', 25));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_expired');
  });

  it('should return insufficient_balance when the amount exceeds the balance', async () => {
    giftCardRepository.getGiftCardByCode.mockResolvedValue(createGiftCard({ currentBalance: 10 }));

    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT1234', 25));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('insufficient_balance');
    expect(result.message).toContain('10');
    expect(giftCardRepository.redeemGiftCard).not.toHaveBeenCalled();
  });

  it('should return redemption_failed when the repository throws', async () => {
    giftCardRepository.redeemGiftCard.mockRejectedValue(new Error('db error'));

    const result = await useCase.execute(new RedeemGiftCardCommand('GIFT1234', 25));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('redemption_failed');
  });
});
