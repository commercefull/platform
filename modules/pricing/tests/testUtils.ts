/**
 * Shared test utilities for pricing unit tests.
 *
 * Pricing ports return plain data shapes rather than domain entities. The
 * factories below return typed mocks of the domain query ports and of each
 * use case's local port interface (extracted via ConstructorParameters where
 * the interface is not exported). All monetary amounts are integer cents.
 */

import type { CreatePriceListUseCase } from '../application/useCases/CreatePriceList';
import type { SetProductPriceUseCase } from '../application/useCases/SetProductPrice';
import type { CurrencyCatalogPort } from '../domain/repositories/CurrencyCatalog';
import type { PricingDataQueryPort } from '../domain/repositories/PricingDataQueryRepository';
import type { CurrencyPriceRuleQueryPort, PricingRuleQueryPort } from '../domain/repositories/PricingRuleQueryRepository';
import type { MembershipBenefitsPort } from '../application/ports/MembershipBenefitsPort';
import type { LoyaltyBalancePort } from '../application/ports/LoyaltyBalancePort';
import type { Currency } from '../domain/currency';
import type { CurrencyPriceRule, PricingRule } from '../domain/pricingRule';
import type { ProductBasePrice } from '../domain/catalogPrice';
import { PricingAdjustmentType, PricingRuleScope, PricingRuleStatus, PricingRuleType } from '../domain/pricingRule';

type PriceListRepositoryPort = ConstructorParameters<typeof CreatePriceListUseCase>[0];
type SetPriceRepositoryPort = ConstructorParameters<typeof SetProductPriceUseCase>[0];

export function createPriceListRepository(): jest.Mocked<PriceListRepositoryPort> {
  const repository: jest.Mocked<PriceListRepositoryPort> = {
    createPriceList: jest.fn(),
  };
  repository.createPriceList.mockImplementation(data =>
    Promise.resolve({
      priceListId: data.priceListId,
      name: data.name,
      type: data.type,
      currencyCode: data.currencyCode,
      isDefault: data.isDefault,
      createdAt: new Date(),
    }),
  );
  return repository;
}

export function createSetPriceRepository(): jest.Mocked<SetPriceRepositoryPort> {
  const repository: jest.Mocked<SetPriceRepositoryPort> = {
    setPrice: jest.fn(),
  };
  repository.setPrice.mockImplementation(data =>
    Promise.resolve({
      productId: data.productId,
      variantId: data.variantId,
      priceCents: data.priceCents,
      salePriceCents: data.salePriceCents,
      updatedAt: new Date(),
    }),
  );
  return repository;
}

// ── Contextual pricing pipeline ports ────────────────────────────────

export function createCurrency(overrides: Partial<Currency> = {}): Currency {
  return {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    isDefault: true,
    isActive: true,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    exchangeRate: 1,
    ...overrides,
  };
}

export function createCurrencyCatalog(currencies: Currency[] = [createCurrency()]): jest.Mocked<CurrencyCatalogPort> {
  const catalog: jest.Mocked<CurrencyCatalogPort> = {
    getByCode: jest.fn(),
    getDefault: jest.fn(),
  };
  catalog.getByCode.mockImplementation(code => Promise.resolve(currencies.find(c => c.code === code) ?? null));
  catalog.getDefault.mockImplementation(() => Promise.resolve(currencies.find(c => c.isDefault) ?? currencies[0] ?? null));
  return catalog;
}

export function createBasePrice(overrides: Partial<ProductBasePrice> = {}): ProductBasePrice {
  return {
    productBasePriceId: 'bp1',
    productId: 'p1',
    currencyCode: 'USD',
    priceCents: 10000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createPricingDataQuery(basePrice: ProductBasePrice | null = createBasePrice()): jest.Mocked<PricingDataQueryPort> {
  const port: jest.Mocked<PricingDataQueryPort> = {
    findEffectiveBasePrice: jest.fn(),
    findApplicableTier: jest.fn(),
    findPriceListsForCustomer: jest.fn(),
    findPricesForProduct: jest.fn(),
    findPriceListItem: jest.fn(),
  };
  port.findEffectiveBasePrice.mockResolvedValue(basePrice);
  port.findApplicableTier.mockResolvedValue(null);
  port.findPriceListsForCustomer.mockResolvedValue([]);
  port.findPricesForProduct.mockResolvedValue([]);
  port.findPriceListItem.mockResolvedValue(null);
  return port;
}

export function createPricingRule(overrides: Partial<PricingRule> = {}): PricingRule {
  return {
    id: 'rule1',
    name: 'Test rule',
    type: PricingRuleType.DYNAMIC,
    scope: PricingRuleScope.GLOBAL,
    status: PricingRuleStatus.ACTIVE,
    priority: 0,
    conditions: [],
    adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 10 }],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createPricingRuleQuery(rules: PricingRule[] = []): jest.Mocked<PricingRuleQueryPort> {
  const port: jest.Mocked<PricingRuleQueryPort> = {
    findActiveRules: jest.fn(),
    findById: jest.fn(),
  };
  port.findActiveRules.mockResolvedValue(rules);
  port.findById.mockImplementation(id => Promise.resolve(rules.find(r => (r.id ?? r.pricingRuleId) === id) ?? null));
  return port;
}

export function createCurrencyPriceRuleQuery(rules: CurrencyPriceRule[] = []): jest.Mocked<CurrencyPriceRuleQueryPort> {
  const port: jest.Mocked<CurrencyPriceRuleQueryPort> = {
    findByCurrencyCode: jest.fn(),
  };
  port.findByCurrencyCode.mockResolvedValue(rules);
  return port;
}

export function createMembershipBenefits(
  benefits: Array<{ id: string; name: string; discountPercentage: number }> = [],
): jest.Mocked<MembershipBenefitsPort> {
  const port: jest.Mocked<MembershipBenefitsPort> = {
    getDiscountBenefits: jest.fn(),
  };
  port.getDiscountBenefits.mockResolvedValue(benefits);
  return port;
}

export function createLoyaltyBalance(points = 0): jest.Mocked<LoyaltyBalancePort> {
  const port: jest.Mocked<LoyaltyBalancePort> = {
    getCustomerPoints: jest.fn(),
  };
  port.getCustomerPoints.mockResolvedValue(points);
  return port;
}
