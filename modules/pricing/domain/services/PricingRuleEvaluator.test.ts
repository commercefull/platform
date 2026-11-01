import { applyAdjustments, convertAmount, isRuleApplicable, selectCurrencyPriceRule } from './PricingRuleEvaluator';
import { PricingAdjustmentType, PricingRuleScope, PricingRuleStatus, PricingRuleType } from '../pricingRule';
import type { CurrencyPriceRule, PricingRule } from '../pricingRule';
import type { Currency } from '../currency';

function createRule(overrides: Partial<PricingRule> = {}): PricingRule {
  return {
    id: 'rule1',
    name: 'Test rule',
    type: PricingRuleType.DYNAMIC,
    scope: PricingRuleScope.GLOBAL,
    status: PricingRuleStatus.ACTIVE,
    priority: 0,
    conditions: [],
    adjustments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createCurrency(overrides: Partial<Currency> = {}): Currency {
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

describe('isRuleApplicable', () => {
  it('should return true when the rule has no constraints', () => {
    expect(isRuleApplicable(createRule(), {})).toBe(true);
  });

  it('should return false when the rule has not started yet', () => {
    const rule = createRule({ startDate: new Date(Date.now() + 86_400_000) });
    expect(isRuleApplicable(rule, { date: new Date() })).toBe(false);
  });

  it('should return false when the rule has expired', () => {
    const rule = createRule({ endDate: new Date(Date.now() - 86_400_000) });
    expect(isRuleApplicable(rule, { date: new Date() })).toBe(false);
  });

  it('should return false when quantity is below the minimum', () => {
    const rule = createRule({ minimumQuantity: 5 });
    expect(isRuleApplicable(rule, { quantity: 2 })).toBe(false);
    expect(isRuleApplicable(rule, { quantity: 5 })).toBe(true);
  });

  it('should return false when quantity exceeds the maximum', () => {
    const rule = createRule({ maximumQuantity: 10 });
    expect(isRuleApplicable(rule, { quantity: 11 })).toBe(false);
  });

  it('should return false when cart total is below the minimum order amount', () => {
    const rule = createRule({ minimumOrderAmountCents: 5000 });
    expect(isRuleApplicable(rule, { cartTotal: 4000 })).toBe(false);
    expect(isRuleApplicable(rule, { cartTotal: 5000 })).toBe(true);
  });

  it('should return false when a product-scoped rule does not match the context products', () => {
    const rule = createRule({ scope: PricingRuleScope.PRODUCT, productIds: ['p1', 'p2'] });
    expect(isRuleApplicable(rule, { productIds: ['p3'] })).toBe(false);
    expect(isRuleApplicable(rule, { productIds: ['p2'] })).toBe(true);
  });

  it('should return false when a customer-scoped rule does not match the customer', () => {
    const rule = createRule({ scope: PricingRuleScope.CUSTOMER, customerIds: ['c1'] });
    expect(isRuleApplicable(rule, { customerId: 'c2' })).toBe(false);
    expect(isRuleApplicable(rule, {})).toBe(false);
    expect(isRuleApplicable(rule, { customerId: 'c1' })).toBe(true);
  });

  it('should return false when a customer-group-scoped rule matches no group', () => {
    const rule = createRule({ scope: PricingRuleScope.CUSTOMER_GROUP, customerGroupIds: ['g1'] });
    expect(isRuleApplicable(rule, { customerGroupIds: ['g2'] })).toBe(false);
    expect(isRuleApplicable(rule, { customerGroupIds: ['g1', 'g2'] })).toBe(true);
  });

  it('should return false when a day_of_week condition does not match', () => {
    const monday = new Date('2026-09-21T12:00:00'); // a Monday
    const rule = createRule({ conditions: [{ type: 'day_of_week', parameters: { days: [0] } }] });
    expect(isRuleApplicable(rule, { date: monday })).toBe(false);
    expect(isRuleApplicable(rule, { date: new Date('2026-09-20T12:00:00') })).toBe(true);
  });

  it('should return false when a customer_attribute condition is unmet', () => {
    const rule = createRule({ conditions: [{ type: 'customer_attribute', parameters: { attribute: 'vip', value: true } }] });
    expect(isRuleApplicable(rule, {})).toBe(false);
    expect(isRuleApplicable(rule, { additionalData: { customerAttributes: { vip: true } } })).toBe(true);
  });

  it('should apply a rule only to its configured store and channel', () => {
    const rule = createRule({
      conditions: [
        { type: 'store', parameters: { storeIds: ['store-1'] } },
        { type: 'channel', parameters: { channelIds: ['channel-1'] } },
      ],
    });

    expect(isRuleApplicable(rule, { storeId: 'store-1', channelId: 'channel-1' })).toBe(true);
    expect(isRuleApplicable(rule, { storeId: 'store-1', channelId: 'channel-2' })).toBe(false);
    expect(isRuleApplicable(rule, { storeId: 'store-2', channelId: 'channel-1' })).toBe(false);
  });
});

describe('applyAdjustments', () => {
  it('should return the price unchanged when there are no adjustments', () => {
    expect(applyAdjustments(10000, [])).toEqual({ priceCents: 10000, applied: false });
  });

  it('should set an absolute price when adjustment is FIXED', () => {
    expect(applyAdjustments(10000, [{ type: PricingAdjustmentType.FIXED, value: 80 }])).toEqual({
      priceCents: 8000,
      applied: true,
    });
  });

  it('should reduce the price when adjustment is PERCENTAGE', () => {
    expect(applyAdjustments(10000, [{ type: PricingAdjustmentType.PERCENTAGE, value: 10 }])).toEqual({
      priceCents: 9000,
      applied: true,
    });
  });

  it('should set an absolute price when adjustment is OVERRIDE', () => {
    expect(applyAdjustments(10000, [{ type: PricingAdjustmentType.OVERRIDE, value: 55.5 }])).toEqual({
      priceCents: 5550,
      applied: true,
    });
  });

  it('should apply adjustments in order when multiple exist', () => {
    const result = applyAdjustments(10000, [
      { type: PricingAdjustmentType.PERCENTAGE, value: 10 },
      { type: PricingAdjustmentType.FIXED, value: 50 },
    ]);
    expect(result).toEqual({ priceCents: 5000, applied: true });
  });

  it('should treat FIXED operands as whole units when currency is zero-decimal JPY', () => {
    expect(applyAdjustments(1500, [{ type: PricingAdjustmentType.FIXED, value: 2000 }], 'JPY')).toEqual({
      priceCents: 2000,
      applied: true,
    });
  });

  it('should treat OVERRIDE operands as thousandths when currency is three-decimal KWD', () => {
    expect(applyAdjustments(1234, [{ type: PricingAdjustmentType.OVERRIDE, value: 2.5 }], 'KWD')).toEqual({
      priceCents: 2500,
      applied: true,
    });
  });
});

describe('selectCurrencyPriceRule', () => {
  const rule = (overrides: Partial<CurrencyPriceRule> = {}): CurrencyPriceRule => ({
    ...createRule(),
    currencyCode: 'EUR',
    adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 5 }],
    ...overrides,
  });

  it('should return null when no rules are given', () => {
    expect(selectCurrencyPriceRule([], 1000)).toBeNull();
  });

  it('should pick the highest-priority matching rule', () => {
    const low = rule({ id: 'low', priority: 1 });
    const high = rule({ id: 'high', priority: 10 });
    expect(selectCurrencyPriceRule([low, high], 1000)?.id).toBe('high');
  });

  it('should skip rules whose order-value thresholds exclude the price', () => {
    const tooSmall = rule({ id: 'tooSmall', minOrderValueCents: 5000 });
    const fits = rule({ id: 'fits', minOrderValueCents: 100, maxOrderValueCents: 9000 });
    expect(selectCurrencyPriceRule([tooSmall, fits], 1000)?.id).toBe('fits');
  });

  it('should return null when the matching rule has no adjustments', () => {
    expect(selectCurrencyPriceRule([rule({ adjustments: [] })], 1000)).toBeNull();
  });
});

describe('convertAmount', () => {
  const usd = createCurrency({ code: 'USD', exchangeRate: 1, isDefault: true });
  const eur = createCurrency({ code: 'EUR', exchangeRate: 0.9, isDefault: false });

  it('should convert at the ratio of exchange rates when no rule applies', () => {
    const result = convertAmount(10000, usd, eur);
    expect(result.convertedPriceCents).toBe(9000);
    expect(result.exchangeRate).toBe(0.9);
  });

  it('should add a fixed amount when the rule adjustment is FIXED', () => {
    const rule = { ...createRule(), currencyCode: 'EUR', adjustments: [{ type: PricingAdjustmentType.FIXED, value: 10 }] };
    const result = convertAmount(10000, usd, eur, rule);
    expect(result.convertedPriceCents).toBe(9000 + 1000);
    expect(result.appliedRuleId).toBe('rule1');
  });

  it('should scale the converted price when the rule adjustment is PERCENTAGE', () => {
    const rule = { ...createRule(), currencyCode: 'EUR', adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 10 }] };
    const result = convertAmount(10000, usd, eur, rule);
    expect(result.convertedPriceCents).toBe(9900);
  });

  it('should override the exchange rate when the rule adjustment is EXCHANGE', () => {
    const rule = { ...createRule(), currencyCode: 'EUR', adjustments: [{ type: PricingAdjustmentType.EXCHANGE, value: 0.8 }] };
    const result = convertAmount(10000, usd, eur, rule);
    expect(result.convertedPriceCents).toBe(8000);
    expect(result.exchangeRate).toBe(0.8);
  });

  it('should scale minor-unit exponents when converting USD cents to zero-decimal JPY', () => {
    // $10.00 (1000 USD cents) at 150 JPY/USD → ¥1,500 (1500 minor units),
    // not ¥150,000 (the old 100× overcharge bug).
    const jpy = createCurrency({ code: 'JPY', exchangeRate: 150, decimalPlaces: 0, isDefault: false });
    const result = convertAmount(1000, usd, jpy);
    expect(result.convertedPriceCents).toBe(1500);
  });

  it('should scale minor-unit exponents when converting USD cents to three-decimal KWD', () => {
    // $10.00 (1000 USD cents) at 0.31 KWD/USD → د.ك3.100 (3100 minor units).
    const kwd = createCurrency({ code: 'KWD', exchangeRate: 0.31, decimalPlaces: 3, isDefault: false });
    const result = convertAmount(1000, usd, kwd);
    expect(result.convertedPriceCents).toBe(3100);
  });

  it('should apply FIXED adjustments in target minor units when converting to JPY', () => {
    const jpy = createCurrency({ code: 'JPY', exchangeRate: 150, decimalPlaces: 0, isDefault: false });
    const rule = { ...createRule(), currencyCode: 'JPY', adjustments: [{ type: PricingAdjustmentType.FIXED, value: 500 }] };
    // $10 → ¥1500, +¥500 fixed → ¥2000
    const result = convertAmount(1000, usd, jpy, rule);
    expect(result.convertedPriceCents).toBe(2000);
  });

  it('should apply EXCHANGE rate overrides with exponent scaling when converting to JPY', () => {
    const jpy = createCurrency({ code: 'JPY', exchangeRate: 150, decimalPlaces: 0, isDefault: false });
    const rule = { ...createRule(), currencyCode: 'JPY', adjustments: [{ type: PricingAdjustmentType.EXCHANGE, value: 160 }] };
    // $10 (1000 cents) at 160 JPY/USD → ¥1600
    const result = convertAmount(1000, usd, jpy, rule);
    expect(result.convertedPriceCents).toBe(1600);
    expect(result.exchangeRate).toBe(160);
  });
});
