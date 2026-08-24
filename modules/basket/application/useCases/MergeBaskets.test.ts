jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { MergeBasketsUseCase, MergeBasketsCommand } from './MergeBaskets';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('MergeBasketsUseCase', () => {
  let useCase: MergeBasketsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeBasket = (id: string) => ({
    basketId: id, customerId: 'c1', sessionId: 's1', status: 'active', currency: 'USD',
    items: id === 'b1' ? [{ basketItemId: 'i1' }] : [], itemCount: 1, subtotal: { amount: 50 },
    createdAt: new Date(), updatedAt: new Date(),
  });

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn((id: string) => Promise.resolve(makeBasket(id))),
      mergeBaskets: jest.fn().mockResolvedValue(makeBasket('b2')),
    };
    useCase = new MergeBasketsUseCase(mockRepo as never);
  });

  it('should merge baskets (happy path)', async () => {
    const result = await useCase.execute(new MergeBasketsCommand('b1', 'b2'));

    expect(result.basketId).toBe('b2');
    expect(mockRepo.mergeBaskets).toHaveBeenCalledWith('b1', 'b2');
    expect(eventBus.emit).toHaveBeenCalledWith('basket.merged', expect.objectContaining({ sourceBasketId: 'b1', targetBasketId: 'b2', itemsMerged: 1 }));
  });

  it('should throw BasketNotFoundError when source basket does not exist', async () => {
    mockRepo.findById.mockImplementation((id: string) => id === 'missing' ? Promise.resolve(null) : Promise.resolve(makeBasket(id)));

    await expect(useCase.execute(new MergeBasketsCommand('missing', 'b2'))).rejects.toThrow(BasketNotFoundError);
  });

  it('should throw BasketNotFoundError when target basket does not exist', async () => {
    mockRepo.findById.mockImplementation((id: string) => id === 'missing' ? Promise.resolve(null) : Promise.resolve(makeBasket(id)));

    await expect(useCase.execute(new MergeBasketsCommand('b1', 'missing'))).rejects.toThrow(BasketNotFoundError);
  });
});
