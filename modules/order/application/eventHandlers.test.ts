/**
 * Tests for order payment event handlers (Published Language migration).
 *
 * Verifies that order.payment_failed events correctly update order
 * status, replacing the previous synchronous ACL call from the
 * payment module's webhook controller.
 */

import { eventBus } from '../../../libs/events/eventBus';

// Mock withTransaction to bypass real DB connection
jest.mock('../../../libs/db', () => ({
  withTransaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
}));

// Mock the OrderDataRepository
jest.mock('../infrastructure/repositories/OrderDataRepository', () => ({
  __esModule: true,
  default: {
    commands: {
      findById: jest.fn(),
      save: jest.fn(),
      recordStatusChange: jest.fn(),
    },
  },
}));

import orderDataRepository from '../infrastructure/repositories/OrderDataRepository';
import { registerOrderPaymentEventHandlers } from '../application/eventHandlers';

const OrderRepo = orderDataRepository.commands;

describe('Order payment event handlers (Published Language)', () => {
  beforeEach(() => {
    eventBus['handlers'].clear();
    registerOrderPaymentEventHandlers();
  });

  afterEach(() => {
    eventBus['handlers'].clear();
    jest.clearAllMocks();
  });

  it('order.payment_failed should update order status to PAYMENT_FAILED', async () => {
    // Create a mock order that can be updated
    const mockOrder = {
      orderId: 'order-1',
      orderNumber: 'ORD-001',
      status: 'pending',
      updatedAt: new Date(),
      updateStatus: jest.fn(),
    };

    (OrderRepo.findById as jest.Mock).mockResolvedValue(mockOrder);
    (OrderRepo.save as jest.Mock).mockResolvedValue(undefined);
    (OrderRepo.recordStatusChange as jest.Mock).mockResolvedValue(undefined);

    await eventBus.emit('order.payment_failed', {
      orderId: 'order-1',
      customerId: 'cust-1',
      reason: 'card declined',
    });

    expect(OrderRepo.findById).toHaveBeenCalledWith('order-1');
    expect(mockOrder.updateStatus).toHaveBeenCalled();
    expect(OrderRepo.save).toHaveBeenCalled();
  });

  it('order.payment_failed should skip if no orderId', async () => {
    await eventBus.emit('order.payment_failed', {
      customerId: 'cust-1',
      reason: 'timeout',
    });

    expect(OrderRepo.findById).not.toHaveBeenCalled();
  });
});
