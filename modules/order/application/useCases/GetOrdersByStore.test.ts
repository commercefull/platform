import { GetOrdersByStoreUseCase } from './GetOrdersByStore';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { Order } from '../../domain/entities/Order';
import type { PaginatedResult } from 'libs/types/shared';

const emptyPage: PaginatedResult<Order> = { data: [], total: 0, limit: 10, offset: 0, hasMore: false, length: 0 };

describe('GetOrdersByStoreUseCase', () => {
  let useCase: GetOrdersByStoreUseCase;
  let mockRepo: jest.Mocked<Pick<OrderRepository, 'findAll'>>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue(emptyPage),
    };
    useCase = new GetOrdersByStoreUseCase(mockRepo as unknown as OrderRepository);
  });

  it('should get orders by store (happy path)', async () => {
    const result = await useCase.execute('store-1');

    expect(result.total).toBe(0);
    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 'store-1' }),
      expect.objectContaining({ limit: 10, offset: 0, orderBy: 'createdAt', orderDirection: 'desc' }),
    );
  });

  it('should pass custom limit and offset', async () => {
    await useCase.execute('store-1', 20, 10);

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 'store-1' }),
      expect.objectContaining({ limit: 20, offset: 10 }),
    );
  });
});
