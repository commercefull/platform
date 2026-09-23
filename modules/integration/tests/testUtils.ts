/**
 * Shared test utilities for integration use-case tests.
 */

import { Integration } from '../domain/entities/Integration';
import { IntegrationEventSubscription } from '../domain/entities/IntegrationEventSubscription';
import { IntegrationLog } from '../domain/entities/IntegrationLog';

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

export function createIntegration(
  overrides: Partial<Parameters<typeof Integration.create>[0]> = {},
): Integration {
  return Integration.create({
    integrationId: 'int-1',
    organizationId: 'org-1',
    name: 'ERP Sync',
    provider: 'custom',
    ...overrides,
  });
}


export function createSubscription(
  overrides: Partial<Parameters<typeof IntegrationEventSubscription.create>[0]> = {},
): IntegrationEventSubscription {
  return IntegrationEventSubscription.create({
    subscriptionId: 'sub-1',
    integrationId: 'int-1',
    eventType: 'order.created',
    targetAction: 'https://example.test/hook',
    ...overrides,
  });
}

export function createIntegrationLog(
  overrides: Partial<Parameters<typeof IntegrationLog.create>[0]> = {},
): IntegrationLog {
  return IntegrationLog.create({
    logId: 'log-1',
    integrationId: 'int-1',
    eventType: 'order.created',
    targetAction: 'https://example.test/hook',
    ...overrides,
  });
}
