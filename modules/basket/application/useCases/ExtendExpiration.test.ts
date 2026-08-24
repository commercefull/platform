jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ExtendExpirationUseCase, ExtendExpirationCommand } from './ExtendExpiration';
import { BasketNotFoundError, InvalidExpirationDaysError } from '../../domain/errors/BasketErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ExtendExpirationUseCase', () => {
  let useCase: ExtendExpirationUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeBasket = () => ({
    basketId: 'b1', customerId: 'c1', sessionId: 's1', status: 'active', currency: 'USD',
    items: [], itemCount: 0, subtotal: { amount: 0 },
    createdAt: new Date(), updatedAt: new Date(),
    expiresAt: new Date(), extendExpiration: jest.fn(),
  });

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue(makeBasket()),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ExtendExpirationUseCase(mockRepo as never);
  });

  it('should extend expiration (happy path)', async () => {
    const result = await useCase.execute(new ExtendExpirationCommand('b1', 7));

    expect(result.basketId).toBe('b1');
    expect(eventBus.emit).toHaveBeenCalledWith('basket.expiration_extended', expect.objectContaining({ basketId: 'b1', days: 7 }));
  });

  it('should throw InvalidExpirationDaysError for days < 1', async () => {
    await expect(useCase.execute(new ExtendExpirationCommand('b1', 0))).rejects.toThrow(InvalidExpirationDaysError);
  });

  it('should throw BasketNotFoundError when basket does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ExtendExpirationCommand('missing', 7))).rejects.toThrow(BasketNotFoundError);
  });
});
