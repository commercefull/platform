import { SetItemAsGiftUseCase, SetItemAsGiftCommand } from './SetItemAsGift';
import { BasketNotFoundError, BasketItemNotFoundError } from '../../domain/errors/BasketErrors';

describe('SetItemAsGiftUseCase', () => {
  let useCase: SetItemAsGiftUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeBasket = () => ({
    basketId: 'b1', customerId: 'c1', sessionId: 's1', status: 'active', currency: 'USD',
    items: [], itemCount: 0, subtotal: { amount: 0 },
    createdAt: new Date(), updatedAt: new Date(),
    findItem: jest.fn((id: string) => id === 'item-1' ? { basketItemId: 'item-1', productId: 'p1' } : null),
    setItemAsGift: jest.fn(),
  });

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue(makeBasket()),
      updateItem: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SetItemAsGiftUseCase(mockRepo as never);
  });

  it('should set item as gift (happy path)', async () => {
    const result = await useCase.execute(new SetItemAsGiftCommand('b1', 'item-1', 'Happy Birthday!'));

    expect(result.basketId).toBe('b1');
  });

  it('should throw BasketNotFoundError when basket does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new SetItemAsGiftCommand('missing', 'item-1'))).rejects.toThrow(BasketNotFoundError);
  });

  it('should throw BasketItemNotFoundError when item does not exist', async () => {
    await expect(useCase.execute(new SetItemAsGiftCommand('b1', 'missing'))).rejects.toThrow(BasketItemNotFoundError);
  });
});
