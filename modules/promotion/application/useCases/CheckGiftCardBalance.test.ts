import '../../tests/testUtils';
import { CheckGiftCardBalanceUseCase, CheckGiftCardBalanceQuery } from './CheckGiftCardBalance';
import { createCheckGiftCardRepository, createGiftCard } from '../../tests/testUtils';

describe('CheckGiftCardBalanceUseCase', () => {
  const giftCardRepository = createCheckGiftCardRepository();
  const useCase = new CheckGiftCardBalanceUseCase(giftCardRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepository.getGiftCardByCode.mockResolvedValue(createGiftCard());
  });

  it('should return the balance and status when the gift card is valid', async () => {
    const result = await useCase.execute(new CheckGiftCardBalanceQuery('GIFT1234'));

    expect(result.success).toBe(true);
    expect(result.currentBalanceCents).toBe(100);
    expect(result.status).toBe('active');
    expect(result.currency).toBe('USD');
    expect(result.message).toBe('Gift card is valid');
  });

  it('should return code_required when the code is empty', async () => {
    const result = await useCase.execute(new CheckGiftCardBalanceQuery(''));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('code_required');
    expect(giftCardRepository.getGiftCardByCode).not.toHaveBeenCalled();
  });

  it('should return gift_card_not_found when the code does not exist', async () => {
    giftCardRepository.getGiftCardByCode.mockResolvedValue(null);

    const result = await useCase.execute(new CheckGiftCardBalanceQuery('UNKNOWN'));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_not_found');
  });

  it('should report expired status when the expiry date has passed', async () => {
    giftCardRepository.getGiftCardByCode.mockResolvedValue(createGiftCard({ expiresAt: new Date('2020-01-01') }));

    const result = await useCase.execute(new CheckGiftCardBalanceQuery('GIFT1234'));

    expect(result.success).toBe(true);
    expect(result.status).toBe('expired');
    expect(result.message).toBe('Gift card is expired');
  });

  it('should report the stored status when the gift card is depleted', async () => {
    giftCardRepository.getGiftCardByCode.mockResolvedValue(createGiftCard({ status: 'depleted', currentBalanceCents: 0 }));

    const result = await useCase.execute(new CheckGiftCardBalanceQuery('GIFT1234'));

    expect(result.status).toBe('depleted');
    expect(result.message).toBe('Gift card is depleted');
  });
});
