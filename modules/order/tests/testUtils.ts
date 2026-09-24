/**
 * Shared test utilities for order use-case tests.
 * Mocks module boundaries (eventBus, uuid, libs/db) once and provides
 * typed repository factories plus record/entity factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { query } from '../../../libs/db';
import { Order } from '../domain/entities/Order';
import { OrderItem } from '../domain/entities/OrderItem';
import { Money } from '../domain/valueObjects/Money';
import type { OrderFulfillment } from '../domain/repositories/OrderFulfillmentRepository';
import type { OrderFulfillmentPackage } from '../domain/repositories/OrderFulfillmentPackageRepository';
import type { OrderReturn, OrderReturnCreateParams } from '../domain/repositories/OrderReturnRepository';
import type { OrderNote } from '../domain/repositories/OrderNoteRepository';
import type { OrderPaymentRefund } from '../domain/repositories/OrderPaymentRefundRepository';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'order-uuid-123'),
  isUuid: jest.fn(() => true),
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../libs/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(async (fn: (client?: unknown) => Promise<unknown>) => fn()),
}));

export const emitMock = jest.mocked(eventBus.emit);
export const queryMock = jest.mocked(query);

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

// ============================================================================
// Entity factories
// ============================================================================

export function createOrder(overrides: Partial<Parameters<typeof Order.create>[0]> = {}): Order {
  return Order.create({
    orderId: 'order-1',
    customerEmail: 'customer@test.com',
    ...overrides,
  });
}

export function createOrderItem(overrides: Partial<Parameters<typeof OrderItem.create>[0]> = {}): OrderItem {
  return OrderItem.create({
    orderItemId: 'item-1',
    orderId: 'order-1',
    productId: 'prod-1',
    sku: 'SKU-1',
    name: 'Test Item',
    quantity: 1,
    unitPrice: Money.create(100, 'USD'),
    ...overrides,
  });
}

// ============================================================================
// Record factories
// ============================================================================

export function createOrderFulfillment(overrides: Partial<OrderFulfillment> = {}): OrderFulfillment {
  return {
    orderFulfillmentId: 'ful-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    orderId: 'order-1',
    fulfillmentNumber: 'FUL-1',
    type: 'shipping',
    status: 'pending',
    ...overrides,
  };
}

export function createOrderFulfillmentPackage(overrides: Partial<OrderFulfillmentPackage> = {}): OrderFulfillmentPackage {
  return {
    orderFulfillmentPackageId: 'pkg-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    orderFulfillmentId: 'ful-1',
    packageNumber: 'PKG-1',
    ...overrides,
  };
}

export function createOrderReturn(overrides: Partial<OrderReturn> = {}): OrderReturn {
  return {
    orderReturnId: 'ret-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    orderId: 'order-1',
    returnNumber: 'RET-1',
    status: 'requested',
    returnType: 'refund',
    requestedAt: '2024-01-01T00:00:00.000Z',
    returnShippingPaid: false,
    returnCarrier: 'custom',
    requiresInspection: false,
    ...overrides,
  };
}

export function createOrderReturnParams(overrides: Partial<OrderReturn> = {}): OrderReturnCreateParams {
  const record: Partial<OrderReturn> = createOrderReturn(overrides);
  delete record.orderReturnId;
  delete record.createdAt;
  delete record.updatedAt;
  delete record.returnNumber;
  delete record.requestedAt;
  delete record.approvedAt;
  delete record.receivedAt;
  delete record.completedAt;
  return record as OrderReturnCreateParams;
}

export function createOrderNote(overrides: Partial<OrderNote> = {}): OrderNote {
  return {
    orderNoteId: 'note-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    orderId: 'order-1',
    content: 'note',
    isCustomerVisible: false,
    ...overrides,
  };
}

export function createOrderPaymentRefund(overrides: Partial<OrderPaymentRefund> = {}): OrderPaymentRefund {
  return {
    orderPaymentRefundId: 'ref-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    orderPaymentId: 'pay-1',
    amountCents: 10,
    status: 'pending',
    ...overrides,
  };
}
