/**
 * Unit Tests for AddOrderNote Use Case
 */

import { AddOrderNoteUseCase, AddOrderNoteCommand } from './AddOrderNote';
import { OrderNotFoundError, NoteContentEmptyError } from '../../domain/errors/OrderErrors';
import { Order } from '../../domain/entities/Order';

import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { OrderQueryRepository, OrderNote } from '../../domain/repositories/OrderQueryRepository';

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

function createMockQueryRepo(): jest.Mocked<OrderQueryRepository> {
  return {
    findNotesByOrder: jest.fn().mockResolvedValue([]),
    createNote: jest.fn().mockResolvedValue({
      orderNoteId: 'note-1',
      orderId: 'o-1',
      content: 'Test note',
      isCustomerVisible: false,
      createdBy: 'admin-1',
      createdAt: new Date().toISOString(),
    } as OrderNote),
    softDeleteNote: jest.fn().mockResolvedValue(true),
    findDiscountsByOrder: jest.fn().mockResolvedValue([]),
    createDiscount: jest.fn(),
    findShippingByOrder: jest.fn().mockResolvedValue([]),
    createShipping: jest.fn(),
    updateShipping: jest.fn(),
    findShippingRatesByOrder: jest.fn().mockResolvedValue([]),
    createShippingRate: jest.fn(),
    findTaxesByOrder: jest.fn().mockResolvedValue([]),
    createTax: jest.fn(),
    findPaymentsByOrder: jest.fn().mockResolvedValue([]),
    findPaymentById: jest.fn().mockResolvedValue(null),
    createPayment: jest.fn(),
    findRefundsByOrder: jest.fn().mockResolvedValue([]),
    findRefundById: jest.fn().mockResolvedValue(null),
    createRefund: jest.fn(),
  } as never as jest.Mocked<OrderQueryRepository>;
}

describe('AddOrderNoteUseCase', () => {
  it('should add a note to an existing order', async () => {
    const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
    const repo = createMockOrderRepo(order);
    const queryRepo = createMockQueryRepo();
    const useCase = new AddOrderNoteUseCase(repo, queryRepo);

    const result = await useCase.execute(
      new AddOrderNoteCommand('o-1', 'Test note', false, 'admin-1'),
    );

    expect(result.orderNoteId).toBe('note-1');
    expect(result.content).toBe('Test note');
    expect(queryRepo.createNote).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'o-1', content: 'Test note' }),
    );
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    const repo = createMockOrderRepo(null);
    const queryRepo = createMockQueryRepo();
    const useCase = new AddOrderNoteUseCase(repo, queryRepo);

    await expect(
      useCase.execute(new AddOrderNoteCommand('nonexistent', 'note')),
    ).rejects.toThrow(OrderNotFoundError);
  });

  it('should throw NoteContentEmptyError when content is empty', async () => {
    const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
    const repo = createMockOrderRepo(order);
    const queryRepo = createMockQueryRepo();
    const useCase = new AddOrderNoteUseCase(repo, queryRepo);

    await expect(
      useCase.execute(new AddOrderNoteCommand('o-1', '  ')),
    ).rejects.toThrow(NoteContentEmptyError);
  });
});
