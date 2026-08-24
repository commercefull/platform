jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ClearBasketUseCase, ClearBasketCommand } from './ClearBasket';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ClearBasketUseCase', () => {
  let useCase: ClearBasketUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeBasket = () => ({
    basketId: 'b1', customerId: 'c1', sessionId: 's1', status: 'active', currency: 'USD',
    items: [], itemCount: 2, subtotal: { amount: 100 },
    createdAt: new Date(), updatedAt: new Date(),
    clearItems: jest.fn(),
  });

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue(makeBasket()),
      clearItems: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ClearBasketUseCase(mockRepo as never);
  });

  it('should clear basket items (happy path)', async () => {
    const result = await useCase.execute(new ClearBasketCommand('b1'));

    expect(result.basketId).toBe('b1');
    expect(mockRepo.clearItems).toHaveBeenCalledWith('b1');
    expect(eventBus.emit).toHaveBeenCalledWith('basket.cleared', expect.objectContaining({ basketId: 'b1', itemCount: 2 }));
  });

  it('should throw BasketNotFoundError when basket does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ClearBasketCommand('missing'))).rejects.toThrow(BasketNotFoundError);
  });
});
