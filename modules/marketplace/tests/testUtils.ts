/**
 * Shared test utilities for marketplace use-case tests.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { Vendor } from '../domain/entities/Vendor';
import { CommissionRule } from '../domain/entities/CommissionRule';
import { VendorPayout } from '../domain/entities/VendorPayout';

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

export function createVendor(overrides: Partial<Parameters<typeof Vendor.create>[0]> = {}): Vendor {
  return Vendor.create({ organizationId: 'org-1', name: 'Vendor Co', email: 'v@x.test', ...overrides });
}

export function createCommissionRule(
  overrides: Partial<Parameters<typeof CommissionRule.create>[0]> = {},
): CommissionRule {
  return CommissionRule.create({
    organizationId: 'org-1',
    name: 'Default Rule',
    type: 'percentage',
    scope: 'global',
    rate: 10,
    ...overrides,
  });
}

export function createPayout(
  overrides: Partial<Parameters<typeof VendorPayout.create>[0]> = {},
): VendorPayout {
  return VendorPayout.create({
    vendorId: 'v-1',
    organizationId: 'org-1',
    method: 'bank_transfer',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    ...overrides,
  });
}
