/**
 * Shared test utilities for agentic-checkout unit tests.
 *
 * Import this file FIRST in each test file: it registers the boundary mocks
 * (event bus, uuid) before the use cases under test are evaluated.
 * Tests use real domain objects — only the ports are mocked.
 */

import { ChannelSession } from '../domain/entities/ChannelSession';
import type { ChannelSessionRepository } from '../domain/repositories/ChannelSessionRepository';
import type { ChannelContext } from '../application/ports/ChannelResolverPort';
import type { ChannelCatalogPort, ChannelProduct } from '../application/ports/ChannelCatalogPort';
import type {
  ChannelCheckoutPort,
  ChannelCheckoutSnapshot,
  ChannelItemInput,
  ChannelAddressInput,
  DelegatedCredential,
} from '../application/ports/ChannelCheckoutPort';
import type { DelegatedPaymentPort, DelegatedChargeRequest } from '../application/ports/DelegatedPaymentPort';
import { eventBus } from '../../../libs/events/eventBus';

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

export const CHANNEL_SESSION_ID = '11111111-1111-1111-1111-111111111111';
export const INTEGRATION_ID = '22222222-2222-2222-2222-222222222222';
export const ORG_ID = '33333333-3333-3333-3333-333333333333';
export const STORE_ID = '44444444-4444-4444-4444-444444444444';
export const BASKET_ID = '55555555-5555-5555-5555-555555555555';
export const CHECKOUT_ID = '66666666-6666-6666-6666-666666666666';
export const ORDER_ID = '77777777-7777-7777-7777-777777777777';
export const PRODUCT_ID = '88888888-8888-8888-8888-888888888888';

export function createChannelContext(overrides: Partial<ChannelContext> = {}): ChannelContext {
  return {
    integrationId: INTEGRATION_ID,
    organizationId: ORG_ID,
    storeId: STORE_ID,
    surface: 'chatgpt',
    currency: 'USD',
    ...overrides,
  };
}

export function createChannelProduct(overrides: Partial<ChannelProduct> = {}): ChannelProduct {
  return {
    productId: PRODUCT_ID,
    name: 'Test Product',
    slug: 'test-product',
    sku: 'SKU-1',
    description: 'A test product',
    imageUrl: 'https://cdn.example.com/p.png',
    effectivePriceCents: 1999,
    currency: 'USD',
    isAvailable: true,
    ...overrides,
  };
}

export function createSession(overrides: Partial<Parameters<typeof ChannelSession.create>[0]> = {}): ChannelSession {
  return ChannelSession.create({
    integrationId: INTEGRATION_ID,
    organizationId: ORG_ID,
    storeId: STORE_ID,
    basketId: BASKET_ID,
    checkoutId: CHECKOUT_ID,
    ...overrides,
  });
}

export function createCheckoutSnapshot(overrides: Partial<ChannelCheckoutSnapshot> = {}): ChannelCheckoutSnapshot {
  return {
    checkoutId: CHECKOUT_ID,
    basketId: BASKET_ID,
    status: 'active',
    paymentStatus: 'unpaid',
    isReadyForPayment: false,
    fulfillmentType: 'shipping',
    subtotalCents: 1999,
    taxAmountCents: 160,
    shippingAmountCents: 500,
    discountAmountCents: 0,
    totalCents: 2659,
    currency: 'USD',
    expiresAt: new Date(Date.now() + 3600_000),
    ...overrides,
  };
}

export function makeSessionRepo(): jest.Mocked<ChannelSessionRepository> {
  return {
    save: jest.fn(async (s: ChannelSession) => s),
    findById: jest.fn(async (_channelSessionId: string) => null),
    findByCheckoutId: jest.fn(async (_checkoutId: string) => null),
    findByIntegration: jest.fn(async (_integrationId: string) => []),
  };
}

export function makeCatalogPort(): jest.Mocked<ChannelCatalogPort> {
  return {
    resolveStoreCatalog: jest.fn(async (_storeId: string) => [createChannelProduct()]),
    findProducts: jest.fn(async (_storeId: string, ids: string[]) => ids.map(id => createChannelProduct({ productId: id }))),
  };
}

export function makeCheckoutPort(): jest.Mocked<ChannelCheckoutPort> {
  return {
    createBasket: jest.fn(async (_params: { sessionId: string; storeId?: string; currency?: string }) => ({
      basketId: BASKET_ID,
    })),
    getBasket: jest.fn(async (_basketId: string) => ({
      basketId: BASKET_ID,
      currency: 'USD',
      items: [
        {
          basketItemId: 'item-1',
          productId: PRODUCT_ID,
          sku: 'SKU-1',
          name: 'Test Product',
          quantity: 1,
          unitPriceCents: 1999,
          lineTotalCents: 1999,
        },
      ],
    })),
    addItem: jest.fn(async (_basketId: string, _item: ChannelItemInput) => undefined),
    updateItemQuantity: jest.fn(async (_basketId: string, _basketItemId: string, _quantity: number) => undefined),
    removeItem: jest.fn(async (_basketId: string, _basketItemId: string) => undefined),
    initiateCheckout: jest.fn(async (_basketId: string, _guestEmail?: string) => createCheckoutSnapshot()),
    getCheckout: jest.fn(async (_checkoutId: string) => createCheckoutSnapshot()),
    setShippingAddress: jest.fn(async (_checkoutId: string, _address: ChannelAddressInput) => createCheckoutSnapshot()),
    setFulfillmentMethod: jest.fn(async (_checkoutId: string, _fulfillmentType: string) => createCheckoutSnapshot()),
    setShippingMethod: jest.fn(async (_checkoutId: string, _methodId: string) => createCheckoutSnapshot()),
    applyCoupon: jest.fn(async (_checkoutId: string, _couponCode: string) => createCheckoutSnapshot()),
    getShippingOptions: jest.fn(async (_checkoutId: string) => []),
    attachDelegatedPayment: jest.fn(async (_checkoutId: string, _credential: DelegatedCredential) => undefined),
    createPaymentIntent: jest.fn(async (_checkoutId: string) => ({
      orderId: ORDER_ID,
      orderNumber: 'ORD-1',
      paymentIntentId: 'pi_1',
    })),
    completeCheckout: jest.fn(async (_checkoutId: string) => ({
      orderId: ORDER_ID,
      orderNumber: 'ORD-1',
      paymentIntentId: 'pi_1',
    })),
    abandonCheckout: jest.fn(async (_checkoutId: string) => undefined),
  };
}

export function makeDelegatedPaymentPort(): jest.Mocked<DelegatedPaymentPort> {
  return {
    chargeDelegatedPayment: jest.fn(async (_params: DelegatedChargeRequest) => ({
      externalTransactionId: 'ext_txn_1',
      provider: 'stripe',
      status: 'paid' as const,
    })),
  };
}
