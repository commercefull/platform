import '../../tests/testUtils';
import { ManageGiftCardsUseCase } from './ManageGiftCards';
import {
  createGiftCardRepository,
  createGiftCard,
} from '../../tests/testUtils';

describe('ManageGiftCardsUseCase', () => {
  const giftCardRepository = createGiftCardRepository();
  const useCase = new ManageGiftCardsUseCase(giftCardRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the gift card for the given code', async () => {
    giftCardRepository.getGiftCardByCode.mockResolvedValue(createGiftCard());

    const result = await useCase.getGiftCardByCode('GIFT1234');

    expect(result?.promotionGiftCardId).toBe('gc-1');
    expect(giftCardRepository.getGiftCardByCode).toHaveBeenCalledWith('GIFT1234');
  });

  it('should delegate gift card listing with filters', async () => {
    giftCardRepository.getGiftCards.mockResolvedValue({ data: [createGiftCard()], total: 1 });

    const result = await useCase.getGiftCards({ status: 'active' }, { limit: 10 });

    expect(result.total).toBe(1);
    expect(giftCardRepository.getGiftCards).toHaveBeenCalledWith({ status: 'active' }, { limit: 10 });
  });

  it('should delegate gift card creation', async () => {
    giftCardRepository.createGiftCard.mockResolvedValue(createGiftCard());
    const input = { initialBalance: 100 };

    const result = await useCase.createGiftCard(input);

    expect(result.promotionGiftCardId).toBe('gc-1');
    expect(giftCardRepository.createGiftCard).toHaveBeenCalledWith(input);
  });

  it('should delegate activation', async () => {
    giftCardRepository.activateGiftCard.mockResolvedValue(undefined);

    await useCase.activateGiftCard('gc-1');

    expect(giftCardRepository.activateGiftCard).toHaveBeenCalledWith('gc-1');
  });

  it('should delegate cancellation', async () => {
    giftCardRepository.cancelGiftCard.mockResolvedValue(undefined);

    await useCase.cancelGiftCard('gc-1');

    expect(giftCardRepository.cancelGiftCard).toHaveBeenCalledWith('gc-1');
  });
});
