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
import { SalesChannel, type SalesChannelProps } from '../domain/entities/SalesChannel';
import type { SalesChannelRepository } from '../domain/repositories/SalesChannelRepository';
import { Market } from '../domain/entities/Market';
import type { MarketRepository } from '../domain/repositories/MarketRepository';
import type { MarketReadinessFactsPort } from '../application/ports/MarketReadinessFactsPort';
import type { MarketReadinessFacts } from '../domain/services/MarketReadinessEvaluator';

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

export function createSalesChannelRepository(): jest.Mocked<SalesChannelRepository> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<SalesChannelRepository>;
}

export function createMarketRepository(): jest.Mocked<MarketRepository> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<MarketRepository>;
}

export function createMarketReadinessFactsPort(facts: Partial<MarketReadinessFacts> = {}): jest.Mocked<MarketReadinessFactsPort> {
  return {
    gatherFacts: jest.fn().mockResolvedValue({
      localeCoveragePercent: 100,
      configuredCurrencyCodes: ['EUR', 'GBP'],
      hasCatalogAssortment: true,
      catalogItemCount: 10,
      hasPriceList: true,
      hasTaxCoverage: true,
      taxJurisdictionsCovered: ['DE', 'FR'],
      hasPaymentMethod: true,
      enabledPaymentMethods: ['creditCard'],
      hasShippingCoverage: true,
      hasReturnsPolicy: true,
      hasContractingEntity: true,
      termsVersion: 'v1',
      complianceRulesCovered: 2,
      hasSupportTemplates: true,
      hasFraudCoverage: true,
      ...facts,
    }),
  };
}

/** Real `Market` domain entity. */
export function createMarket(overrides: Partial<Parameters<typeof Market.create>[0]> = {}): Market {
  return Market.create({
    marketId: 'market-1',
    organizationId: 'org-1',
    storeId: 'store-1',
    code: 'EU',
    name: 'European Union',
    countryCodes: ['DE', 'FR'],
    defaultCurrencyCode: 'EUR',
    supportedCurrencyCodes: ['EUR', 'GBP'],
    defaultLocaleCode: 'en-GB',
    supportedLocaleCodes: ['en-GB', 'de-DE'],
    catalogAssortmentId: 'assort-1',
    defaultPriceListId: 'pl-1',
    contractingEntityId: 'ent-1',
    allowedPaymentMethods: ['creditCard'],
    allowedFulfillmentMethods: ['shipping'],
    hostnamePatterns: ['%.eu.example.com'],
    metadata: { termsVersion: 'v1' },
    ...overrides,
  });
}

export function createSalesChannel(overrides: Partial<SalesChannelProps> = {}): SalesChannel {
  return SalesChannel.reconstitute({
    salesChannelId: 'channel-1',
    organizationId: 'org-1',
    code: 'website',
    name: 'Website',
    type: 'web',
    status: 'active',
    config: {},
    metadata: {},
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
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
