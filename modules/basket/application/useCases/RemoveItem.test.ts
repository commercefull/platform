jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RemoveItemUseCase, RemoveItemCommand } from './RemoveItem';
import { BasketNotFoundError, BasketItemNotFoundError } from '../../domain/errors/BasketErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('RemoveItemUseCase', () => {
  let useCase: RemoveItemUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeBasket = () => ({
    basketId: 'b1', customerId: 'c1', sessionId: 's1', status: 'active', currency: 'USD',
    items: [], itemCount: 0, subtotal: { amount: 0 },
    createdAt: new Date(), updatedAt: new Date(),
    findItem: jest.fn((id: string) => id === 'item-1' ? { basketItemId: 'item-1', productId: 'p1' } : null),
  });

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue(makeBasket()),
      removeItem: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RemoveItemUseCase(mockRepo as never);
  });

  it('should remove item from basket (happy path)', async () => {
    const result = await useCase.execute(new RemoveItemCommand('b1', 'item-1'));

    expect(result.basketId).toBe('b1');
    expect(mockRepo.removeItem).toHaveBeenCalledWith('item-1');
    expect(eventBus.emit).toHaveBeenCalledWith('basket.item_removed', expect.objectContaining({ basketId: 'b1' }));
  });

  it('should throw BasketNotFoundError when basket does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new RemoveItemCommand('missing', 'item-1'))).rejects.toThrow(BasketNotFoundError);
  });

  it('should throw BasketItemNotFoundError when item does not exist', async () => {
    await expect(useCase.execute(new RemoveItemCommand('b1', 'missing'))).rejects.toThrow(BasketItemNotFoundError);
  });
});
