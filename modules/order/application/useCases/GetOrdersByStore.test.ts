import { GetOrdersByStoreUseCase } from './GetOrdersByStore';

describe('GetOrdersByStoreUseCase', () => {
  let useCase: GetOrdersByStoreUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 10, offset: 0, hasMore: false }),
    };
    useCase = new GetOrdersByStoreUseCase(mockRepo as never);
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
