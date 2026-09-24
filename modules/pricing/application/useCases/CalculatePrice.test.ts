import {
  createBasePrice,
  createCurrency,
  createCurrencyCatalog,
  createCurrencyPriceRuleQuery,
  createLoyaltyBalance,
  createMembershipBenefits,
  createPricingDataQuery,
  createPricingRule,
  createPricingRuleQuery,
} from '../../tests/testUtils';
import { CalculatePriceUseCase } from './CalculatePrice';
import { ConvertPriceUseCase } from './ConvertPrice';
import { PricingAdjustmentType, PricingRuleScope } from '../../domain/pricingRule';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

function buildUseCase(
  overrides: {
    currencyCatalog?: ReturnType<typeof createCurrencyCatalog>;
    pricingData?: ReturnType<typeof createPricingDataQuery>;
    pricingRules?: ReturnType<typeof createPricingRuleQuery>;
    currencyPriceRules?: ReturnType<typeof createCurrencyPriceRuleQuery>;
    membershipBenefits?: ReturnType<typeof createMembershipBenefits>;
    loyaltyBalance?: ReturnType<typeof createLoyaltyBalance>;
  } = {},
) {
  const currencyCatalog = overrides.currencyCatalog ?? createCurrencyCatalog();
  const pricingData = overrides.pricingData ?? createPricingDataQuery();
  const pricingRules = overrides.pricingRules ?? createPricingRuleQuery();
  const currencyPriceRules = overrides.currencyPriceRules ?? createCurrencyPriceRuleQuery();
  const membershipBenefits = overrides.membershipBenefits ?? createMembershipBenefits();
  const loyaltyBalance = overrides.loyaltyBalance ?? createLoyaltyBalance();
  const convertPrice = new ConvertPriceUseCase(currencyCatalog, currencyPriceRules);

  const useCase = new CalculatePriceUseCase(
    currencyCatalog,
    pricingData,
    pricingRules,
    membershipBenefits,
    loyaltyBalance,
    convertPrice,
  );

  return { useCase, currencyCatalog, pricingData, pricingRules, currencyPriceRules, membershipBenefits, loyaltyBalance };
}

describe('CalculatePriceUseCase', () => {
  it('should return the catalog base price when no rules apply', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute({ productId: 'p1' });

    expect(result.originalPriceCents).toBe(10000);
    expect(result.finalPriceCents).toBe(10000);
    expect(result.currency).toBe('USD');
    expect(result.appliedRules).toEqual([]);
  });

  it('should throw PricingValidationError when no base price exists', async () => {
    const { useCase } = buildUseCase({ pricingData: createPricingDataQuery(null) });

    await expect(useCase.execute({ productId: 'missing' })).rejects.toThrow(PricingValidationError);
  });

  it('should resolve the variant price when a variant is given', async () => {
    const { useCase, pricingData } = buildUseCase();

    await useCase.execute({ productId: 'p1', variantId: 'v1', quantity: 1 });

    expect(pricingData.findEffectiveBasePrice).toHaveBeenCalledWith('p1', 'v1', 'USD');
  });

  it('should prefer the sale price as the effective starting point', async () => {
    const { useCase } = buildUseCase({
      pricingData: createPricingDataQuery(createBasePrice({ priceCents: 10000, salePriceCents: 8000 })),
    });

    const result = await useCase.execute({ productId: 'p1' });

    expect(result.originalPriceCents).toBe(10000);
    expect(result.finalPriceCents).toBe(8000);
  });

  it('should convert the price when the requested currency differs', async () => {
    const usd = createCurrency({ code: 'USD', exchangeRate: 1, isDefault: true });
    const eur = createCurrency({ code: 'EUR', exchangeRate: 0.9, isDefault: false });
    const { useCase } = buildUseCase({ currencyCatalog: createCurrencyCatalog([usd, eur]) });

    const result = await useCase.execute({ productId: 'p1', currencyCode: 'EUR' });

    expect(result.finalPriceCents).toBe(9000);
    expect(result.currency).toBe('EUR');
    expect(result.originalCurrency).toBe('USD');
  });

  it('should apply an explicit price list override when priceListId is given', async () => {
    const pricingData = createPricingDataQuery();
    pricingData.findPriceListItem.mockResolvedValue({ priceCents: 7500 });
    const { useCase } = buildUseCase({ pricingData });

    const result = await useCase.execute({ productId: 'p1', priceListId: 'pl1' });

    expect(result.finalPriceCents).toBe(7500);
    expect(pricingData.findPriceListItem).toHaveBeenCalledWith('pl1', 'p1', undefined);
    expect(result.appliedRules[0]?.ruleId).toBe('pl1');
  });

  it('should apply the tier price when a quantity tier matches', async () => {
    const pricingData = createPricingDataQuery();
    pricingData.findApplicableTier.mockResolvedValue({
      id: 'tier1',
      productId: 'p1',
      quantityMin: 5,
      priceCents: 8000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const { useCase } = buildUseCase({ pricingData });

    const result = await useCase.execute({ productId: 'p1', quantity: 10 });

    expect(result.finalPriceCents).toBe(8000);
    expect(result.appliedRules[0]?.ruleName).toContain('Tier Pricing');
    expect(result.appliedRules[0]?.impact).toBe(2000);
  });

  it('should apply a customer price list adjustment when the customer matches', async () => {
    const pricingData = createPricingDataQuery();
    pricingData.findPriceListsForCustomer.mockResolvedValue([
      {
        id: 'pl1',
        name: 'VIP',
        customerIds: ['c1'],
        customerGroupIds: [],
        priority: 1,
        status: 'active' as never,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    pricingData.findPricesForProduct.mockResolvedValue([
      {
        id: 'cp1',
        priceListId: 'pl1',
        productId: 'p1',
        adjustmentType: PricingAdjustmentType.PERCENTAGE,
        adjustmentValue: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const { useCase } = buildUseCase({ pricingData });

    const result = await useCase.execute({ productId: 'p1', customerId: 'c1' });

    expect(result.finalPriceCents).toBe(8000);
    expect(result.appliedRules[0]?.ruleName).toBe('Customer Price (VIP)');
  });

  it('should apply dynamic pricing rules in priority order', async () => {
    const pricingRules = createPricingRuleQuery([
      createPricingRule({ id: 'low', name: 'Low', priority: 1, adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 5 }] }),
      createPricingRule({ id: 'high', name: 'High', priority: 10, adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 10 }] }),
    ]);
    const { useCase } = buildUseCase({ pricingRules });

    const result = await useCase.execute({ productId: 'p1' });

    // 10000 → high (10%): 9000 → low (5%): 8550
    expect(result.finalPriceCents).toBe(8550);
    expect(result.appliedRules.map(r => r.ruleId)).toEqual(['high', 'low']);
  });

  it('should skip excluded rules when excludeRuleIds is given', async () => {
    const pricingRules = createPricingRuleQuery([
      createPricingRule({ id: 'excluded', adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 10 }] }),
      createPricingRule({ id: 'kept', adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 20 }] }),
    ]);
    const { useCase } = buildUseCase({ pricingRules });

    const result = await useCase.execute({ productId: 'p1', excludeRuleIds: ['excluded'] });

    expect(result.finalPriceCents).toBe(8000);
    expect(result.appliedRules.map(r => r.ruleId)).toEqual(['kept']);
  });

  it('should not apply rules whose conditions are unmet', async () => {
    const pricingRules = createPricingRuleQuery([
      createPricingRule({
        scope: PricingRuleScope.CUSTOMER,
        customerIds: ['other'],
        adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 50 }],
      }),
    ]);
    const { useCase } = buildUseCase({ pricingRules });

    const result = await useCase.execute({ productId: 'p1', customerId: 'c1' });

    expect(result.finalPriceCents).toBe(10000);
    expect(result.appliedRules).toEqual([]);
  });

  it('should apply the best membership discount when the customer has benefits', async () => {
    const membershipBenefits = createMembershipBenefits([
      { id: 'm1', name: 'Silver', discountPercentage: 5 },
      { id: 'm2', name: 'Gold', discountPercentage: 15 },
    ]);
    const { useCase } = buildUseCase({ membershipBenefits });

    const result = await useCase.execute({ productId: 'p1', customerId: 'c1' });

    expect(result.finalPriceCents).toBe(8500);
    expect(result.appliedRules[0]?.ruleName).toBe('Membership: Gold');
  });

  it('should still return a price when the membership lookup fails', async () => {
    const membershipBenefits = createMembershipBenefits();
    membershipBenefits.getDiscountBenefits.mockRejectedValue(new Error('membership down'));
    const { useCase } = buildUseCase({ membershipBenefits });

    const result = await useCase.execute({ productId: 'p1', customerId: 'c1' });

    expect(result.finalPriceCents).toBe(10000);
  });

  it('should apply a loyalty points discount when requested', async () => {
    const loyaltyBalance = createLoyaltyBalance(5000);
    const { useCase } = buildUseCase({ loyaltyBalance });

    const result = await useCase.execute({
      productId: 'p1',
      customerId: 'c1',
      additionalData: { applyLoyaltyDiscount: true, loyaltyPointsToApply: 2000, pointsToMoneyRatio: 0.01 },
    });

    // 2000 points * 0.01 * 100 = 2000 cents off
    expect(result.finalPriceCents).toBe(8000);
    expect(result.appliedRules[0]?.ruleName).toBe('Loyalty Points (2000 points)');
  });

  it('should not apply loyalty points beyond the customer balance', async () => {
    const loyaltyBalance = createLoyaltyBalance(100);
    const { useCase } = buildUseCase({ loyaltyBalance });

    const result = await useCase.execute({
      productId: 'p1',
      customerId: 'c1',
      additionalData: { applyLoyaltyDiscount: true, loyaltyPointsToApply: 2000 },
    });

    expect(result.finalPriceCents).toBe(10000);
  });
});
