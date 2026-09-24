/**
 * Shared test helpers for the fulfillment module.
 * Boundary mocks (event bus, domain event emitters, libs/db) + real entity factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { withTransaction, type TxClient } from '../../../libs/db';
import * as fulfillmentEvents from '../domain/events/FulfillmentEvents';
import { Fulfillment, type FulfillmentStatus, type FulfillmentProps } from '../domain/entities/Fulfillment';
import { FulfillmentItem, type FulfillmentItemProps } from '../domain/entities/FulfillmentItem';
import type { IFulfillmentRepository } from '../domain/repositories/FulfillmentRepository';
import type { IAdminOperationsRepository } from '../domain/repositories/AdminOperationsRepository';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

jest.mock('../domain/events/FulfillmentEvents', () => ({
  __esModule: true,
  emitFulfillmentCreated: jest.fn(),
  emitFulfillmentAssigned: jest.fn(),
  emitFulfillmentPickingStarted: jest.fn(),
  emitFulfillmentPackingCompleted: jest.fn(),
  emitFulfillmentShipped: jest.fn(),
  emitFulfillmentDelivered: jest.fn(),
  emitFulfillmentFailed: jest.fn(),
  emitFulfillmentReturned: jest.fn(),
}));

export const emitMock = jest.mocked(eventBus.emit);
export const withTransactionMock = jest.mocked(withTransaction);
export const emitFulfillmentCreatedMock = jest.mocked(fulfillmentEvents.emitFulfillmentCreated);
export const emitFulfillmentPickingStartedMock = jest.mocked(fulfillmentEvents.emitFulfillmentPickingStarted);
export const emitFulfillmentShippedMock = jest.mocked(fulfillmentEvents.emitFulfillmentShipped);
export const emitFulfillmentDeliveredMock = jest.mocked(fulfillmentEvents.emitFulfillmentDelivered);

const txClientStub: TxClient = {
  query: jest.fn().mockResolvedValue(null),
  queryOne: jest.fn().mockResolvedValue(null),
};

beforeEach(() => {
  jest.clearAllMocks();
  withTransactionMock.mockImplementation(<T>(fn: (tx: TxClient) => Promise<T>) => fn(txClientStub));
});

/**
 * A lazily-created `jest.Mocked<T>`: every accessed method is a `jest.fn`,
 * so tests configure only the methods they exercise.
 */
function lazyMock<T>(): jest.Mocked<T> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
}

export function createFulfillmentRepository(): jest.Mocked<IFulfillmentRepository> {
  return lazyMock();
}

export function createAdminOperationsRepository(): jest.Mocked<IAdminOperationsRepository> {
  return lazyMock();
}

export function createFulfillment(
  status: FulfillmentStatus = 'pending',
  overrides: Partial<FulfillmentProps> = {},
): Fulfillment {
  return Fulfillment.fromPersistence({
    fulfillmentId: 'ful-1',
    orderId: 'ord-1',
    orderNumber: 'ORD-001',
    sourceType: 'warehouse',
    sourceId: 'wh-1',
    status,
    shipFromAddress: { addressLine1: '123 St', city: 'Portland', postalCode: '97201', countryCode: 'US' },
    shipToAddress: { addressLine1: '456 Ave', city: 'Seattle', postalCode: '98101', countryCode: 'US' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

export function createFulfillmentItem(overrides: Partial<FulfillmentItemProps> = {}): FulfillmentItem {
  return FulfillmentItem.fromPersistence({
    fulfillmentItemId: 'item-1',
    fulfillmentId: 'ful-1',
    orderItemId: 'oi-1',
    productId: 'prod-1',
    sku: 'SKU-1',
    name: 'Widget',
    quantityOrdered: 5,
    quantityFulfilled: 0,
    isPicked: false,
    isPacked: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}
