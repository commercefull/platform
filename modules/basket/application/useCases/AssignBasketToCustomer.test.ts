jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { AssignBasketToCustomerUseCase, AssignBasketToCustomerCommand } from './AssignBasketToCustomer';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('AssignBasketToCustomerUseCase', () => {
  let useCase: AssignBasketToCustomerUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeBasket = () => ({
    basketId: 'b1', customerId: undefined, sessionId: 's1', status: 'active', currency: 'USD',
    items: [], itemCount: 0, subtotal: { amount: 0 },
    createdAt: new Date(), updatedAt: new Date(),
    assignToCustomer: jest.fn(),
  });

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue(makeBasket()),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new AssignBasketToCustomerUseCase(mockRepo as never);
  });

  it('should assign basket to customer (happy path)', async () => {
    const result = await useCase.execute(new AssignBasketToCustomerCommand('b1', 'c1'));

    expect(result.basketId).toBe('b1');
    expect(eventBus.emit).toHaveBeenCalledWith('basket.assigned_to_customer', expect.objectContaining({ basketId: 'b1', customerId: 'c1' }));
  });

  it('should throw BasketNotFoundError when basket does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new AssignBasketToCustomerCommand('missing', 'c1'))).rejects.toThrow(BasketNotFoundError);
  });
});
