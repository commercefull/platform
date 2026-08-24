/**
 * Unit Tests for GetOrder Use Case
 */

import { GetOrderUseCase, GetOrderCommand } from './GetOrder';
import { Order } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { Money } from '../../domain/valueObjects/Money';
import { OrderIdOrNumberRequiredError, OrderPermissionError } from '../../domain/errors/OrderErrors';

import type { OrderRepository } from '../../domain/repositories/OrderRepository';

function createOrderWithItem(): Order {
  const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
  order.addItem(
    OrderItem.create({
      orderItemId: 'i-1',
      orderId: 'o-1',
      productId: 'p-1',
      sku: 'SKU-1',
      name: 'Widget',
      quantity: 2,
      unitPrice: Money.create(50, 'USD'),
    }),
  );
  return order;
}

function createMockOrderRepo(order: Order | null): jest.Mocked<OrderRepository> {
  return {
    findById: jest.fn().mockResolvedValue(order),
    findByOrderNumber: jest.fn().mockResolvedValue(order),
    findByCustomerId: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findByStatus: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findByPaymentStatus: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findByFulfillmentStatus: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findByDateRange: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    save: jest.fn().mockResolvedValue(order),
    delete: jest.fn().mockResolvedValue(undefined),
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
    recordStatusChange: jest.fn().mockResolvedValue(undefined),
    recordPaymentStatusChange: jest.fn().mockResolvedValue(undefined),
    recordFulfillmentStatusChange: jest.fn().mockResolvedValue(undefined),
    getStatusHistory: jest.fn().mockResolvedValue([]),
    getPaymentStatusHistory: jest.fn().mockResolvedValue([]),
    getFulfillmentStatusHistory: jest.fn().mockResolvedValue([]),
    getOrderStats: jest.fn().mockResolvedValue({ totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, ordersByStatus: {} }),
  } as never as jest.Mocked<OrderRepository>;
}

describe('GetOrderUseCase', () => {
  it('should return order details by ID', async () => {
    const order = createOrderWithItem();
    const repo = createMockOrderRepo(order);
    const useCase = new GetOrderUseCase(repo);

    const result = await useCase.execute(new GetOrderCommand('o-1'));

    expect(result).not.toBeNull();
    expect(result!.orderId).toBe('o-1');
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].name).toBe('Widget');
  });

  it('should return order details by order number', async () => {
    const order = createOrderWithItem();
    const repo = createMockOrderRepo(order);
    const useCase = new GetOrderUseCase(repo);

    const result = await useCase.execute(new GetOrderCommand(undefined, 'ORD-001'));

    expect(result).not.toBeNull();
    expect(repo.findByOrderNumber).toHaveBeenCalledWith('ORD-001');
  });

  it('should return null when order does not exist', async () => {
    const repo = createMockOrderRepo(null);
    const useCase = new GetOrderUseCase(repo);

    const result = await useCase.execute(new GetOrderCommand('nonexistent'));

    expect(result).toBeNull();
  });

  it('should throw OrderPermissionError when customerId does not match', async () => {
    const order = createOrderWithItem();
    const repo = createMockOrderRepo(order);
    const useCase = new GetOrderUseCase(repo);

    await expect(
      useCase.execute(new GetOrderCommand('o-1', undefined, 'wrong-customer')),
    ).rejects.toThrow(OrderPermissionError);
  });

  it('should throw OrderIdOrNumberRequiredError when neither ID nor number provided', () => {
    expect(() => new GetOrderCommand()).toThrow(OrderIdOrNumberRequiredError);
  });
});
