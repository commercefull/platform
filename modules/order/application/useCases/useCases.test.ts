/**
 * Unit Tests for Order Use Cases
 */

import { CancelOrderCommand, CancelOrderUseCase } from './CancelOrder';
import { UpdateOrderStatusCommand, UpdateOrderStatusUseCase } from './UpdateOrderStatus';
import { ProcessRefundCommand, ProcessRefundUseCase } from './ProcessRefund';
import { CreateOrderCommand, CreateOrderUseCase } from './CreateOrder';
import { Order } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { Money } from '../../domain/valueObjects/Money';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import {
  OrderNotFoundError,
  CancelOrderPermissionError,
  OrderCannotBeCancelledError,
  OrderCannotBeRefundedError,
  RefundAmountMustBePositiveError,
  RefundExceedsOrderTotalError,
  OrderMustContainItemsError,
  CustomerEmailRequiredError,
  ShippingAddressRequiredError,
} from '../../domain/errors/OrderErrors';

import type { OrderRepository } from '../../domain/repositories/OrderRepository';

// Mock withTransaction to just execute the callback
jest.mock('../../../../libs/db', () => ({
  withTransaction: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

// Mock eventBus to avoid side effects
jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

function createMockOrderRepo(order: Order | null): jest.Mocked<OrderRepository> {
  return {
    findById: jest.fn().mockResolvedValue(order),
    save: jest.fn().mockResolvedValue(order),
    recordStatusChange: jest.fn().mockResolvedValue(undefined),
    recordPaymentStatusChange: jest.fn().mockResolvedValue(undefined),
    recordFulfillmentStatusChange: jest.fn().mockResolvedValue(undefined),
  } as never as jest.Mocked<OrderRepository>;
}

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

describe('CancelOrderUseCase', () => {
  it('should cancel a pending order', async () => {
    const order = createOrderWithItem();
    const repo = createMockOrderRepo(order);
    const useCase = new CancelOrderUseCase(repo);

    const result = await useCase.execute(new CancelOrderCommand('o-1', 'customer request'));

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(repo.save).toHaveBeenCalledWith(order);
    expect(repo.recordStatusChange).toHaveBeenCalled();
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    const repo = createMockOrderRepo(null);
    const useCase = new CancelOrderUseCase(repo);

    await expect(
      useCase.execute(new CancelOrderCommand('nonexistent', 'reason')),
    ).rejects.toThrow(OrderNotFoundError);
  });

  it('should throw CancelOrderPermissionError when customerId does not match', async () => {
    const order = createOrderWithItem();
    const repo = createMockOrderRepo(order);
    const useCase = new CancelOrderUseCase(repo);

    await expect(
      useCase.execute(new CancelOrderCommand('o-1', 'reason', 'wrong-customer')),
    ).rejects.toThrow(CancelOrderPermissionError);
  });

  it('should throw OrderCannotBeCancelledError when order is completed', async () => {
    const order = createOrderWithItem();
    order.updateStatus(OrderStatus.PROCESSING);
    order.updateStatus(OrderStatus.SHIPPED);
    order.updateStatus(OrderStatus.DELIVERED);
    order.updateStatus(OrderStatus.COMPLETED);
    const repo = createMockOrderRepo(order);
    const useCase = new CancelOrderUseCase(repo);

    await expect(
      useCase.execute(new CancelOrderCommand('o-1', 'reason')),
    ).rejects.toThrow(OrderCannotBeCancelledError);
  });
});

describe('UpdateOrderStatusUseCase', () => {
  it('should update order status from PENDING to PROCESSING', async () => {
    const order = createOrderWithItem();
    const repo = createMockOrderRepo(order);
    const useCase = new UpdateOrderStatusUseCase(repo);

    const result = await useCase.execute(
      new UpdateOrderStatusCommand('o-1', OrderStatus.PROCESSING, 'processing'),
    );

    expect(result.status).toBe(OrderStatus.PROCESSING);
    expect(repo.save).toHaveBeenCalledWith(order);
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    const repo = createMockOrderRepo(null);
    const useCase = new UpdateOrderStatusUseCase(repo);

    await expect(
      useCase.execute(new UpdateOrderStatusCommand('nonexistent', OrderStatus.PROCESSING)),
    ).rejects.toThrow(OrderNotFoundError);
  });
});

describe('ProcessRefundUseCase (Order)', () => {
  it('should process a full refund', async () => {
    const order = createOrderWithItem();
    order.updateStatus(OrderStatus.PROCESSING);
    order.updatePaymentStatus(PaymentStatus.PAID);
    const repo = createMockOrderRepo(order);
    const useCase = new ProcessRefundUseCase(repo);

    const result = await useCase.execute(
      new ProcessRefundCommand('o-1', 100, 'customer request'),
    );

    expect(result.isFullRefund).toBe(true);
    expect(result.refundAmount).toBe(100);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw OrderNotFoundError when order does not exist', async () => {
    const repo = createMockOrderRepo(null);
    const useCase = new ProcessRefundUseCase(repo);

    await expect(
      useCase.execute(new ProcessRefundCommand('nonexistent', 50, 'reason')),
    ).rejects.toThrow(OrderNotFoundError);
  });

  it('should throw OrderCannotBeRefundedError when order is not refundable', async () => {
    const order = createOrderWithItem();
    // PENDING + PENDING payment → not refundable
    const repo = createMockOrderRepo(order);
    const useCase = new ProcessRefundUseCase(repo);

    await expect(
      useCase.execute(new ProcessRefundCommand('o-1', 50, 'reason')),
    ).rejects.toThrow(OrderCannotBeRefundedError);
  });

  it('should throw RefundAmountMustBePositiveError for zero amount', async () => {
    const order = createOrderWithItem();
    order.updateStatus(OrderStatus.PROCESSING);
    order.updatePaymentStatus(PaymentStatus.PAID);
    const repo = createMockOrderRepo(order);
    const useCase = new ProcessRefundUseCase(repo);

    await expect(
      useCase.execute(new ProcessRefundCommand('o-1', 0, 'reason')),
    ).rejects.toThrow(RefundAmountMustBePositiveError);
  });

  it('should throw RefundExceedsOrderTotalError when amount exceeds total', async () => {
    const order = createOrderWithItem();
    order.updateStatus(OrderStatus.PROCESSING);
    order.updatePaymentStatus(PaymentStatus.PAID);
    const repo = createMockOrderRepo(order);
    const useCase = new ProcessRefundUseCase(repo);

    await expect(
      useCase.execute(new ProcessRefundCommand('o-1', 999, 'reason')),
    ).rejects.toThrow(RefundExceedsOrderTotalError);
  });
});

describe('CreateOrderUseCase', () => {
  const validItems = [
    {
      productId: 'p-1',
      sku: 'SKU-1',
      name: 'Widget',
      quantity: 2,
      unitPrice: 50,
    },
  ];

  const validAddress = {
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postalCode: '12345',
    country: 'US',
    countryCode: 'US',
  };

  it('should create an order with valid input', async () => {
    const order = createOrderWithItem();
    const repo = createMockOrderRepo(order);
    const useCase = new CreateOrderUseCase(repo);

    const result = await useCase.execute(
      new CreateOrderCommand(
        'cust-1',
        'test@example.com',
        validItems,
        validAddress as never,
      ),
    );

    expect(result.orderId).toBe('o-1');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw OrderMustContainItemsError when items is empty', async () => {
    const repo = createMockOrderRepo(null);
    const useCase = new CreateOrderUseCase(repo);

    await expect(
      useCase.execute(
        new CreateOrderCommand('cust-1', 'test@example.com', [], validAddress as never),
      ),
    ).rejects.toThrow(OrderMustContainItemsError);
  });

  it('should throw CustomerEmailRequiredError when email is missing', async () => {
    const repo = createMockOrderRepo(null);
    const useCase = new CreateOrderUseCase(repo);

    await expect(
      useCase.execute(
        new CreateOrderCommand('cust-1', '', validItems, validAddress as never),
      ),
    ).rejects.toThrow(CustomerEmailRequiredError);
  });

  it('should throw ShippingAddressRequiredError when address is missing', async () => {
    const repo = createMockOrderRepo(null);
    const useCase = new CreateOrderUseCase(repo);

    await expect(
      useCase.execute(
        new CreateOrderCommand('cust-1', 'test@example.com', validItems, undefined as never),
      ),
    ).rejects.toThrow(ShippingAddressRequiredError);
  });
});
