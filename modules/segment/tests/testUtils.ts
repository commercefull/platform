/**
 * Shared test utilities for segment use-case tests.
 * Provides typed lazy port mocks plus entity factories.
 */

import { SegmentDefinition } from '../domain/entities/SegmentDefinition';
import type { SegmentCondition } from '../domain/entities/SegmentDefinition';
import { CustomerProfile } from '../domain/entities/CustomerProfile';

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

const CONDITION: SegmentCondition = { field: 'lifetimeValue', operator: 'gte', value: 100 };

export function createSegment(overrides: Partial<Parameters<typeof SegmentDefinition.create>[0]> = {}): SegmentDefinition {
  return SegmentDefinition.create({
    name: 'VIP',
    code: 'vip',
    conditions: [CONDITION],
    ...overrides,
  });
}

export function createCustomerProfile(
  overrides: Partial<Parameters<typeof CustomerProfile.create>[0]> = {},
): CustomerProfile {
  return CustomerProfile.create({ customerId: 'cust-1', ...overrides });
}
