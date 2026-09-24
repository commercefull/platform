/**
 * Unit Tests for CalculateRuleImpactUseCase
 *
 * Covers the ruleId overload, the rule-object overload, and the
 * `excludeRuleIds` regression: the "before" price must exclude the rule
 * being measured (previously it was silently ignored).
 */

import { CalculateRuleImpactUseCase } from './CalculateRuleImpact';
import type { CalculatePriceUseCase } from './CalculatePrice';
import { createPricingRule, createPricingRuleQuery } from '../../tests/testUtils';
import { PricingAdjustmentType, type PricingResult } from '../../domain/pricingRule';
import { PricingRuleNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';

function createResult(priceCents: number): PricingResult {
  return {
    originalPriceCents: priceCents,
    finalPriceCents: priceCents,
    appliedRules: [],
    currency: 'USD',
  };
}

describe('CalculateRuleImpactUseCase', () => {
  let useCase: CalculateRuleImpactUseCase;
  let calculatePrice: jest.Mocked<Pick<CalculatePriceUseCase, 'execute'>>;

  beforeEach(() => {
    calculatePrice = { execute: jest.fn() };
    calculatePrice.execute.mockResolvedValue(createResult(10000));
  });

  it('should throw PricingRuleNotFoundError when the ruleId does not resolve', async () => {
    useCase = new CalculateRuleImpactUseCase(createPricingRuleQuery([]), calculatePrice);

    await expect(useCase.execute({ ruleId: 'missing', productId: 'p1' })).rejects.toThrow(PricingRuleNotFoundError);
  });

  it('should exclude the rule from the baseline price calculation (ruleId overload)', async () => {
    const rule = createPricingRule({ id: 'rule-9', adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 10 }] });
    useCase = new CalculateRuleImpactUseCase(createPricingRuleQuery([rule]), calculatePrice);

    const result = await useCase.execute({ ruleId: 'rule-9', productId: 'p1' });

    expect(calculatePrice.execute).toHaveBeenCalledWith(expect.objectContaining({ excludeRuleIds: ['rule-9'] }));
    // 10% off 10000 → after 9000 → impact 1000
    expect(result.impact).toBe(1000);
    expect(result.percentageImpact).toBe(10);
    expect(result.afterRule.finalPriceCents).toBe(9000);
  });

  it('should fall back to pricingRuleId when the fetched row has no id (ruleId overload)', async () => {
    const rule = createPricingRule({ id: undefined as unknown as string, pricingRuleId: 'row-7' });
    useCase = new CalculateRuleImpactUseCase(createPricingRuleQuery([rule]), calculatePrice);

    await useCase.execute({ ruleId: 'row-7', productId: 'p1' });

    expect(calculatePrice.execute).toHaveBeenCalledWith(expect.objectContaining({ excludeRuleIds: ['row-7'] }));
  });

  it('should support the rule-object overload using productIds from context', async () => {
    // FIXED adjustments set an absolute price in major units: 75 → 7500 cents.
    const rule = createPricingRule({ id: 'rule-1', adjustments: [{ type: PricingAdjustmentType.FIXED, value: 75 }] });
    useCase = new CalculateRuleImpactUseCase(createPricingRuleQuery([]), calculatePrice);

    const result = await useCase.execute({ rule, context: { productIds: ['p1'] } });

    expect(calculatePrice.execute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', excludeRuleIds: ['rule-1'] }),
    );
    expect(result.afterRule.finalPriceCents).toBe(7500);
    expect(result.impact).toBe(2500);
  });

  it('should reject the rule-object overload without productIds in context', async () => {
    useCase = new CalculateRuleImpactUseCase(createPricingRuleQuery([]), calculatePrice);

    await expect(useCase.execute({ rule: createPricingRule(), context: {} })).rejects.toThrow(PricingValidationError);
  });
});
