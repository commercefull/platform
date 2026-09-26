/**
 * Shared test utilities for basket unit tests.
 *
 * Import this file FIRST in each test file: it registers the boundary mocks
 * (event bus, uuid) before the use cases under test are evaluated.
 * Tests use real domain objects — only the ports are mocked.
 */

import { Basket } from '../domain/entities/Basket';
import { BasketItem, BasketItemProps } from '../domain/entities/BasketItem';
import { Money } from '../domain/valueObjects/Money';
import { eventBus } from '../../../libs/events/eventBus';
import type { BasketRepository } from '../domain/repositories/BasketRepository';
import type { DiscountQuotePort, DiscountQuoteResult } from '../application/ports/DiscountQuotePort';
import type { ProductPricePort, ResolvedProductPrice } from '../application/ports/ProductPricePort';

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

export const BASKET_ID = 'basket-1';
export const ITEM_ID = 'item-1';

type BasketItemInput = Omit<BasketItemProps, 'createdAt' | 'updatedAt'>;

export function createBasketItem(overrides: Partial<BasketItemInput> = {}): BasketItem {
  return BasketItem.create({
    basketItemId: ITEM_ID,
    basketId: BASKET_ID,
    productId: 'product-1',
    sku: 'SKU-1',
    name: 'Widget',
    quantity: 1,
    unitPrice: Money.create(50, 'USD'),
    itemType: 'physical',
    isGift: false,
    ...overrides,
  });
}

interface BasketOptions {
  basketId?: string;
  customerId?: string;
  sessionId?: string;
  currency?: string;
  expiresAt?: Date;
  items?: BasketItem[];
}

export function createBasket(options: BasketOptions = {}): Basket {
  const basket = Basket.create({
    basketId: options.basketId ?? BASKET_ID,
    customerId: options.customerId,
    sessionId: options.sessionId,
    currency: options.currency,
    expiresAt: options.expiresAt,
  });
  for (const item of options.items ?? []) {
    basket.addItem(item);
  }
  return basket;
}

export function createBasketRepository(basket: Basket | null = null): jest.Mocked<BasketRepository> {
  const repository: jest.Mocked<BasketRepository> = {
    findById: jest.fn(),
    findByCustomerId: jest.fn(),
    findBySessionId: jest.fn(),
    findActiveBasket: jest.fn(),
    findSummaries: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    getItems: jest.fn(),
    clearItems: jest.fn(),
    findAbandonedBaskets: jest.fn(),
    findExpiredBaskets: jest.fn(),
    markAsAbandoned: jest.fn(),
    mergeBaskets: jest.fn(),
  };

  repository.findById.mockResolvedValue(basket);
  repository.findByCustomerId.mockResolvedValue(basket);
  repository.findBySessionId.mockResolvedValue(basket);
  repository.findActiveBasket.mockResolvedValue(basket);
  repository.save.mockImplementation(b => Promise.resolve(b));
  repository.delete.mockResolvedValue(undefined);
  repository.addItem.mockImplementation((_basketId, item) => Promise.resolve(item));
  repository.updateItem.mockImplementation(item => Promise.resolve(item));
  repository.removeItem.mockResolvedValue(undefined);
  repository.getItems.mockResolvedValue(basket?.items ?? []);
  repository.clearItems.mockResolvedValue(undefined);
  repository.findAbandonedBaskets.mockResolvedValue([]);
  repository.findExpiredBaskets.mockResolvedValue([]);
  repository.markAsAbandoned.mockResolvedValue(undefined);
  repository.mergeBaskets.mockResolvedValue(basket as Basket);

  return repository;
}

const validPercentageQuote: DiscountQuoteResult = {
  valid: true,
  discount: { code: 'SAVE10', type: 'percentage', value: 10, discountAmountCents: 1000 },
};

export function createDiscountQuotePort(result: DiscountQuoteResult = validPercentageQuote): jest.Mocked<DiscountQuotePort> {
  const port: jest.Mocked<DiscountQuotePort> = { validateDiscount: jest.fn() };
  port.validateDiscount.mockResolvedValue(result);
  return port;
}

export function createProductPricePort(
  price: ResolvedProductPrice | null = { unitPriceCents: 5000, currency: 'USD' },
): jest.Mocked<ProductPricePort> {
  const port: jest.Mocked<ProductPricePort> = { getPrice: jest.fn() };
  port.getPrice.mockResolvedValue(price);
  return port;
}
