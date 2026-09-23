import { ListOrdersUseCase, ListOrdersCommand } from './ListOrders';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import { createOrder } from '../../tests/testUtils';

describe('ListOrdersUseCase', () => {
  let useCase: ListOrdersUseCase;
  let mockRepo: jest.Mocked<Pick<OrderRepository, 'findAll'>>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue({
        data: [createOrder({ orderId: 'o1', orderNumber: 'ORD-o1' }), createOrder({ orderId: 'o2', orderNumber: 'ORD-o2' })],
        total: 2,
        limit: 50,
        offset: 0,
        hasMore: false,
        length: 2,
      }),
    };
    useCase = new ListOrdersUseCase(mockRepo as unknown as OrderRepository);
  });

  it('should list orders (happy path)', async () => {
    const result = await useCase.execute(new ListOrdersCommand());

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should pass filters and pagination to repository', async () => {
    await useCase.execute(new ListOrdersCommand({ customerId: 'c1', status: OrderStatus.PENDING }, 10, 5, 'orderNumber', 'asc'));

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c1' }),
      expect.objectContaining({ limit: 10, offset: 5, orderBy: 'orderNumber', orderDirection: 'asc' }),
    );
  });
});
