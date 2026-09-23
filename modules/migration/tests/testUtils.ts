/**
 * Shared test utilities for migration use-case tests.
 */

import { ImportJob } from '../domain/entities/ImportJob';
import { ImportMapping } from '../domain/entities/ImportMapping';
import { ImportError } from '../domain/entities/ImportError';

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

export function createImportJob(overrides: Partial<Parameters<typeof ImportJob.create>[0]> = {}): ImportJob {
  return ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify', ...overrides });
}

export function createImportMapping(
  overrides: Partial<Parameters<typeof ImportMapping.create>[0]> = {},
): ImportMapping {
  return ImportMapping.create({
    importJobId: 'job-1', entityType: 'product', sourceId: 'src-1', platformId: 'plat-1', ...overrides,
  });
}

export function createImportError(
  overrides: Partial<Parameters<typeof ImportError.create>[0]> = {},
): ImportError {
  return ImportError.create({
    importJobId: 'job-1', entityType: 'product', message: 'bad row', ...overrides,
  });
}
