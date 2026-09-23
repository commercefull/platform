import { lazyMock, createOrder } from '../../tests/testUtils';
import { GetOrderForFulfillmentUseCase } from './GetOrderForFulfillment';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';

describe('GetOrderForFulfillmentUseCase', () => {
  let useCase: GetOrderForFulfillmentUseCase;
  let orderRepo: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    orderRepo = lazyMock<OrderRepository>();
    useCase = new GetOrderForFulfillmentUseCase(orderRepo);
  });

  it('should find the order by ID', async () => {
    orderRepo.findById.mockResolvedValue(createOrder({ orderId: 'o1' }));

    const result = await useCase.findById('o1');

    expect(result?.orderId).toBe('o1');
  });
});
