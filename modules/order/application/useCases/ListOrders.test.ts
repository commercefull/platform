import { ListOrdersUseCase, ListOrdersCommand } from './ListOrders';

describe('ListOrdersUseCase', () => {
  let useCase: ListOrdersUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeOrder = (id: string) => ({
    orderId: id, orderNumber: `ORD-${id}`, customerId: 'c1', storeId: 's1', channelId: 'ch1',
    createdByUserId: 'u1', orderSource: 'web', customerEmail: 'test@test.com', customerName: 'Test',
    status: 'pending', paymentStatus: 'pending', fulfillmentStatus: 'unfulfilled',
    totalAmount: { amount: 100 }, totalItems: 2, currencyCode: 'USD',
    orderDate: new Date(), createdAt: new Date(), tags: [],
  });

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue({
        data: [makeOrder('o1'), makeOrder('o2')], total: 2, limit: 50, offset: 0, hasMore: false,
      }),
    };
    useCase = new ListOrdersUseCase(mockRepo as never);
  });

  it('should list orders (happy path)', async () => {
    const result = await useCase.execute(new ListOrdersCommand());

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should pass filters and pagination to repository', async () => {
    await useCase.execute(new ListOrdersCommand({ customerId: 'c1', status: 'pending' as never }, 10, 5, 'orderNumber', 'asc'));

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c1' }),
      expect.objectContaining({ limit: 10, offset: 5, orderBy: 'orderNumber', orderDirection: 'asc' }),
    );
  });
});
