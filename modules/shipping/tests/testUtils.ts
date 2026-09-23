/**
 * Shared test utilities for shipping use-case tests.
 * Mocks module boundaries (eventBus, uuid, logger, db) once and provides
 * typed repository/port factories plus record factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { query } from '../../../libs/db';
import type { ShippingCarrier, ShippingMethod, ShippingZone, ShippingRate } from '../../../libs/db/types';
import type { ShippingLabel } from '../domain/repositories/ShippingLabelRepository';
import type {
  ShippingCarrierPort,
  ShippingMethodPort,
  ShippingZonePort,
  ShippingRatePort,
} from '../domain/repositories/ShippingConfigPorts';
import type { ShippingLabelPort } from '../domain/repositories/ShippingLabelRepository';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'shipping-uuid-123'),
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../libs/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(async (fn: (client: unknown) => Promise<unknown>) => fn({ query: jest.fn() })),
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

export function createShippingCarrierPort(): jest.Mocked<ShippingCarrierPort> {
  return lazyMock<ShippingCarrierPort>();
}

export function createShippingMethodPort(): jest.Mocked<ShippingMethodPort> {
  return lazyMock<ShippingMethodPort>();
}

export function createShippingZonePort(): jest.Mocked<ShippingZonePort> {
  return lazyMock<ShippingZonePort>();
}

export function createShippingRatePort(): jest.Mocked<ShippingRatePort> {
  return lazyMock<ShippingRatePort>();
}

export function createShippingLabelPort(): jest.Mocked<ShippingLabelPort> {
  return lazyMock<ShippingLabelPort>();
}

// ============================================================================
// Record factories
// ============================================================================

export function createShippingCarrier(overrides: Partial<ShippingCarrier> = {}): ShippingCarrier {
  return {
    shippingCarrierId: 'carrier-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    name: 'Test Carrier',
    code: 'TEST',
    description: null,
    websiteUrl: null,
    trackingUrl: null,
    isActive: true,
    accountNumber: null,
    apiCredentials: null,
    supportedRegions: ['US'],
    supportedServices: ['ground'],
    requiresContract: false,
    hasApiIntegration: false,
    customFields: null,
    createdBy: null,
    ...overrides,
  };
}

export function createShippingMethod(overrides: Partial<ShippingMethod> = {}): ShippingMethod {
  return {
    shippingMethodId: 'method-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    shippingCarrierId: 'carrier-1',
    name: 'Standard Shipping',
    code: 'STANDARD',
    description: null,
    isActive: true,
    isDefault: false,
    serviceCode: null,
    domesticInternational: 'domestic',
    estimatedDeliveryDays: { min: 3, max: 5 },
    handlingDays: 1,
    priority: null,
    displayOnFrontend: true,
    allowFreeShipping: false,
    minWeight: null,
    maxWeight: null,
    minOrderValue: null,
    maxOrderValue: null,
    dimensionRestrictions: null,
    shippingClass: null,
    customFields: null,
    createdBy: null,
    ...overrides,
  };
}

export function createShippingZone(overrides: Partial<ShippingZone> = {}): ShippingZone {
  return {
    shippingZoneId: 'zone-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    name: 'US Zone',
    description: null,
    isActive: true,
    priority: null,
    locationType: 'country',
    locations: ['US'],
    excludedLocations: null,
    createdBy: null,
    ...overrides,
  };
}

export function createShippingRate(overrides: Partial<ShippingRate> = {}): ShippingRate {
  return {
    shippingRateId: 'rate-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    shippingZoneId: 'zone-1',
    shippingMethodId: 'method-1',
    name: 'Flat Rate',
    description: null,
    isActive: true,
    rateType: 'flat',
    baseRate: '5.00',
    perItemRate: null,
    freeThreshold: null,
    rateMatrix: null,
    minRate: null,
    maxRate: null,
    currency: 'USD',
    taxable: true,
    priority: null,
    validFrom: null,
    validTo: null,
    conditions: null,
    createdBy: null,
    ...overrides,
  };
}

export function createShippingLabel(overrides: Partial<ShippingLabel> = {}): ShippingLabel {
  return {
    shippingLabelId: 'label-1',
    shippingCarrierId: 'carrier-1',
    carrierName: 'Test Carrier',
    carrierService: 'ground',
    trackingNumber: 'TRACK-1',
    labelUrl: 'https://example.com/label.pdf',
    labelFormat: 'PDF',
    status: 'created',
    orderId: 'order-1',
    fulfillmentId: undefined,
    shipFromName: 'Warehouse',
    shipToName: 'Customer',
    shipToAddressLine1: '1 Main St',
    shipToCity: 'Springfield',
    shipToState: 'IL',
    shipToPostalCode: '62701',
    shipToCountry: 'US',
    weight: 1.5,
    dimensions: undefined,
    shippingCost: 5.0,
    voidReason: undefined,
    voidedAt: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ============================================================================
// Domain entity factories
// ============================================================================

import { ShippingMethod as ShippingMethodEntity, ShippingMethodProps } from '../domain/entities/ShippingMethod';
import { ShippingZone as ShippingZoneEntity, ShippingZoneProps } from '../domain/entities/ShippingZone';

export function createShippingMethodEntity(overrides: Partial<ShippingMethodProps> = {}): ShippingMethodEntity {
  return ShippingMethodEntity.fromPersistence({
    shippingMethodId: 'method-1',
    name: 'Standard',
    code: 'std',
    type: 'flat_rate',
    basePrice: 9.99,
    zoneIds: ['zone-1'],
    isActive: true,
    isDefault: true,
    sortOrder: 0,
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
    carrierType: 'fedex',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

export function createShippingZoneEntity(overrides: Partial<ShippingZoneProps> = {}): ShippingZoneEntity {
  return ShippingZoneEntity.fromPersistence({
    shippingZoneId: 'zone-1',
    name: 'US',
    locations: [{ countryCode: 'US' }],
    isDefault: false,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}
