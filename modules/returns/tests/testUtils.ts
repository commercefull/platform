/**
 * Shared test utilities for returns use-case tests.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { ReturnRequest } from '../domain/entities/ReturnRequest';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

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

export function createReturnRequest(
  overrides: Partial<Parameters<typeof ReturnRequest.create>[0]> = {},
): ReturnRequest {
  return ReturnRequest.create({
    orderId: 'order-1',
    customerId: 'cust-1',
    returnType: 'refund',
    items: [{ orderItemId: 'item-1', quantity: 1, returnReason: 'damaged', condition: 'used', restockItem: false }],
    ...overrides,
  });
}
