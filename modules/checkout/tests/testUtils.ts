/**
 * Shared test utilities for checkout use-case tests.
 * Mocks the module boundaries (eventBus, uuid) once and provides
 * typed repository/port factories plus real domain entity factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { CheckoutSession, CheckoutSessionProps } from '../domain/entities/CheckoutSession';
import { Address } from '../domain/valueObjects/Address';
import { Money } from '../../../libs/money';
import type { CheckoutRepository } from '../domain/repositories/CheckoutRepository';
import type { BasketSnapshotPort, BasketSnapshot } from '../application/ports/BasketSnapshotPort';
import type { DiscountQuotePort } from '../application/ports/DiscountQuotePort';
import type { FraudScreeningPort } from '../application/ports/FraudScreeningPort';
import type { OrderPlacementPort } from '../application/ports/OrderPlacementPort';
import type { PaymentAuthorizationPort } from '../application/ports/PaymentAuthorizationPort';
import type { PromotionQuotePort } from '../application/ports/PromotionQuotePort';
import type { ShippingQuotePort } from '../application/ports/ShippingQuotePort';
import type { StoreFulfillmentPort } from '../application/ports/StoreFulfillmentPort';
import type { TaxQuotePort } from '../application/ports/TaxQuotePort';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'checkout-uuid-123'),
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks (e.g. `'send' in service`) must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

export function createCheckoutRepository(): jest.Mocked<CheckoutRepository> {
  return lazyMock<CheckoutRepository>();
}


export function createBasketSnapshotPort(): jest.Mocked<BasketSnapshotPort> {
  return lazyMock<BasketSnapshotPort>();
}

export function createDiscountQuotePort(): jest.Mocked<DiscountQuotePort> {
  return lazyMock<DiscountQuotePort>();
}

export function createFraudScreeningPort(): jest.Mocked<FraudScreeningPort> {
  return lazyMock<FraudScreeningPort>();
}

export function createOrderPlacementPort(): jest.Mocked<OrderPlacementPort> {
  return lazyMock<OrderPlacementPort>();
}

export function createPaymentAuthorizationPort(): jest.Mocked<PaymentAuthorizationPort> {
  return lazyMock<PaymentAuthorizationPort>();
}

export function createPromotionQuotePort(): jest.Mocked<PromotionQuotePort> {
  return lazyMock<PromotionQuotePort>();
}

export function createShippingQuotePort(): jest.Mocked<ShippingQuotePort> {
  return lazyMock<ShippingQuotePort>();
}


export function createStoreFulfillmentPort(): jest.Mocked<StoreFulfillmentPort> {
  return lazyMock<StoreFulfillmentPort>();
}

export function createTaxQuotePort(): jest.Mocked<TaxQuotePort> {
  return lazyMock<TaxQuotePort>();
}

export function createCheckoutSession(overrides: Partial<CheckoutSessionProps> = {}): CheckoutSession {
  return CheckoutSession.reconstitute({
    id: 'ck-1',
    basketId: 'b-1',
    status: 'active',
    paymentStatus: 'pending',
    sameAsShipping: true,
    subtotal: Money.create(100, 'USD'),
    taxAmount: Money.create(0, 'USD'),
    shippingAmount: Money.create(0, 'USD'),
    discountAmount: Money.create(0, 'USD'),
    total: Money.create(100, 'USD'),
    fulfillmentType: 'shipping',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    expiresAt: new Date('2099-01-01'),
    ...overrides,
  });
}

export function createAddress(overrides: Record<string, unknown> = {}): Address {
  return Address.create({
    firstName: 'Jane',
    lastName: 'Doe',
    addressLine1: '123 Main St',
    city: 'Portland',
    postalCode: '97201',
    country: 'US',
    region: 'OR',
    ...overrides,
  });
}

export function createBasketSnapshot(overrides: Partial<BasketSnapshot> = {}): BasketSnapshot {
  return {
    basketId: 'b-1',
    currency: 'USD',
    isEmpty: false,
    itemCount: 2,
    uniqueItemCount: 2,
    subtotal: Money.create(100, 'USD'),
    discountAmountCents: 0,
    total: Money.create(100, 'USD'),
    items: [],
    ...overrides,
  };
}
