/**
 * Shared test helpers for the store module.
 * Boundary mocks (event bus, uuid) + typed port mocks + real Store factory.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { Store } from '../domain/entities/Store';
import type { StoreType } from '../domain/entities/Store';
import type { StoreRepository } from '../domain/repositories/StoreRepository';
import type { SystemConfigPort, SystemConfigSummary } from '../application/ports/SystemConfigPort';
import type { OrganizationLookupPort, OrganizationSummary } from '../application/ports/OrganizationLookupPort';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'test-uuid'),
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => {
  emitMock.mockClear();
});

/**
 * A full `jest.Mocked<StoreRepository>`: every accessed method is a
 * lazily-created `jest.fn`, so tests configure only the methods they exercise.
 */
export function createStoreRepository(): jest.Mocked<StoreRepository> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<StoreRepository>;
}

export function createSystemConfigPort(overrides: Partial<SystemConfigSummary> = {}): jest.Mocked<SystemConfigPort> {
  return {
    findActive: jest.fn().mockResolvedValue({
      isMarketplace: false,
      isMultiStore: true,
      isSingleStore: false,
      ...overrides,
    }),
  };
}

export function createOrganizationLookupPort(): jest.Mocked<OrganizationLookupPort> {
  const org: OrganizationSummary = { id: 'org-1', name: 'Test Org', status: 'active' };
  return {
    findById: jest.fn().mockResolvedValue(org),
    findAll: jest.fn().mockResolvedValue([org]),
  };
}

/**
 * Real `Store` domain entity.
 */
export function createStore(
  overrides: Partial<{
    storeId: string;
    name: string;
    slug: string;
    storeType: StoreType;
    organizationId: string;
    isHeadquarters: boolean;
    parentStoreId: string;
    isActive: boolean;
    isVerified: boolean;
    isFeatured: boolean;
  }> = {},
): Store {
  return Store.create({
    storeId: 'store-1',
    name: 'Test Store',
    slug: 'test-store',
    storeType: 'organization_store',
    organizationId: 'org-1',
    ...overrides,
  });
}
