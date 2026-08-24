/**
 * Unit Tests for GetCustomerOrders Use Case
 */

import { GetCustomerOrdersUseCase, GetCustomerOrdersCommand } from './GetCustomerOrders';
import { Order } from '../../domain/entities/Order';
import { CustomerIdRequiredError } from '../../domain/errors/OrderErrors';

import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { PaginatedResult } from 'libs/types/shared';

function createMockOrderRepo(orders: Order[] = []): jest.Mocked<OrderRepository> {
  const paginated: PaginatedResult<Order> = {
    data: orders,
    total: orders.length,
    limit: 20,
    offset: 0,
    hasMore: false,
    length: orders.length,
  };
  return {
    findById: jest.fn().mockResolvedValue(null),
    findByOrderNumber: jest.fn().mockResolvedValue(null),
    findByCustomerId: jest.fn().mockResolvedValue(paginated),
    findAll: jest.fn().mockResolvedValue(paginated),
    findByStatus: jest.fn().mockResolvedValue(paginated),
    findByPaymentStatus: jest.fn().mockResolvedValue(paginated),
    findByFulfillmentStatus: jest.fn().mockResolvedValue(paginated),
    findByDateRange: jest.fn().mockResolvedValue(paginated),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    countByCustomer: jest.fn().mockResolvedValue(0),
    countByStatus: jest.fn().mockResolvedValue(0),
    getOrderItems: jest.fn().mockResolvedValue([]),
    addOrderItem: jest.fn(),
    updateOrderItem: jest.fn(),
    removeOrderItem: jest.fn(),
    getOrderAddresses: jest.fn().mockResolvedValue([]),
    saveOrderAddress: jest.fn(),
    getShippingAddress: jest.fn().mockResolvedValue(null),
    getBillingAddress: jest.fn().mockResolvedValue(null),
    recordStatusChange: jest.fn(),
    recordPaymentStatusChange: jest.fn(),
    recordFulfillmentStatusChange: jest.fn(),
    getStatusHistory: jest.fn().mockResolvedValue([]),
    getPaymentStatusHistory: jest.fn().mockResolvedValue([]),
    getFulfillmentStatusHistory: jest.fn().mockResolvedValue([]),
    getOrderStats: jest.fn().mockResolvedValue({ totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, ordersByStatus: {} }),
  } as never as jest.Mocked<OrderRepository>;
}

describe('GetCustomerOrdersUseCase', () => {
  it('should return paginated customer orders', async () => {
    const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
    const repo = createMockOrderRepo([order]);
    const useCase = new GetCustomerOrdersUseCase(repo);

    const result = await useCase.execute(new GetCustomerOrdersCommand('cust-1'));

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].orderId).toBe('o-1');
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(repo.findByCustomerId).toHaveBeenCalledWith('cust-1', expect.any(Object));
  });

  it('should throw CustomerIdRequiredError when customerId is empty', async () => {
    const repo = createMockOrderRepo();
    const useCase = new GetCustomerOrdersUseCase(repo);

    await expect(
      useCase.execute(new GetCustomerOrdersCommand('')),
    ).rejects.toThrow(CustomerIdRequiredError);
  });

  it('should pass pagination parameters to repository', async () => {
    const repo = createMockOrderRepo();
    const useCase = new GetCustomerOrdersUseCase(repo);

    await useCase.execute(
      new GetCustomerOrdersCommand('cust-1', 10, 20, 'status', 'asc'),
    );

    expect(repo.findByCustomerId).toHaveBeenCalledWith(
      'cust-1',
      expect.objectContaining({ limit: 10, offset: 20, orderBy: 'status', orderDirection: 'asc' }),
    );
  });
});
