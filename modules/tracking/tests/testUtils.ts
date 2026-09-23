/**
 * Shared test utilities for tracking use-case tests.
 */

import { generateUUID } from '../../../libs/uuid';
import { TrackingConfig } from '../domain/entities/TrackingConfig';

jest.mock('../../../libs/uuid', () => ({ generateUUID: jest.fn() }));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

export const uuidMock = jest.mocked(generateUUID);

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

export function createTrackingConfig(
  overrides: Partial<Parameters<typeof TrackingConfig.create>[0]> = {},
): TrackingConfig {
  return TrackingConfig.create({
    configId: 'cfg-1',
    storeId: 'store-1',
    organizationId: 'org-1',
    gtm: { containerId: 'GTM-1', serverContainerUrl: 'https://gtm.test' },
    useDefaultMappings: true,
    serverSideEnabled: true,
    ...overrides,
  });
}
