/**
 * Tests for order payment event handlers (Published Language migration).
 *
 * Verifies that order.payment_failed events correctly update order
 * status, replacing the previous synchronous ACL call from the
 * payment module's webhook controller.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { Order } from '../domain/entities/Order';
import { OrderStatus } from '../domain/valueObjects/OrderStatus';
import { registerOrderPaymentEventHandlers } from '../application/eventHandlers';
import type { OrderRepository } from '../domain/repositories/OrderRepository';

// Mock withTransaction to bypass real DB connection
jest.mock('../../../libs/db', () => ({
  withTransaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
}));

describe('Order payment event handlers (Published Language)', () => {
  let orders: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    eventBus['handlers'].clear();
    orders = {
      findById: jest.fn(),
      save: jest.fn(),
      recordStatusChange: jest.fn(),
    } as unknown as jest.Mocked<OrderRepository>;
    registerOrderPaymentEventHandlers(orders);
  });

  afterEach(() => {
    eventBus['handlers'].clear();
  });

  it('should mark the order as payment failed when payment fails', async () => {
    const order = Order.create({ orderId: 'order-1', customerEmail: 't@e.com' });
    order.updateStatus(OrderStatus.PAYMENT_PENDING);
    orders.findById.mockResolvedValue(order);
    orders.save.mockResolvedValue(order);

    await eventBus.emit('order.payment_failed', {
      orderId: 'order-1',
      customerId: 'cust-1',
      reason: 'card declined',
    });

    expect(orders.findById).toHaveBeenCalledWith('order-1');
    expect(order.status).toBe(OrderStatus.PAYMENT_FAILED);
    expect(orders.save).toHaveBeenCalledWith(order);
    expect(orders.recordStatusChange).toHaveBeenCalledWith('order-1', OrderStatus.PAYMENT_FAILED, undefined, OrderStatus.PAYMENT_PENDING);
  });

  it('should do nothing when the event has no orderId', async () => {
    await eventBus.emit('order.payment_failed', {
      customerId: 'cust-1',
      reason: 'timeout',
    });

    expect(orders.findById).not.toHaveBeenCalled();
  });
});
