import {
  createCurrency,
  createCurrencyCatalog,
  createCurrencyPriceRuleQuery,
  createPricingRule,
} from '../../tests/testUtils';
import { ConvertPriceUseCase } from './ConvertPrice';
import { PricingAdjustmentType } from '../../domain/pricingRule';
import { CurrencyNotFoundError } from '../../domain/errors/PricingErrors';

const usd = createCurrency({ code: 'USD', exchangeRate: 1, isDefault: true });
const eur = createCurrency({ code: 'EUR', exchangeRate: 0.9, isDefault: false });

function buildUseCase(currencyRules = createCurrencyPriceRuleQuery()) {
  const currencyCatalog = createCurrencyCatalog([usd, eur]);
  return { useCase: new ConvertPriceUseCase(currencyCatalog, currencyRules), currencyCatalog, currencyRules };
}

describe('ConvertPriceUseCase', () => {
  it('should return the same price when currencies match', async () => {
    const { useCase, currencyCatalog } = buildUseCase();

    const result = await useCase.execute({ priceCents: 10000, fromCurrencyCode: 'USD', toCurrencyCode: 'USD' });

    expect(result).toEqual({ convertedPriceCents: 10000, exchangeRate: 1, appliedRules: [] });
    expect(currencyCatalog.getByCode).not.toHaveBeenCalled();
  });

  it('should convert at the exchange-rate ratio when no currency rule applies', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute({ priceCents: 10000, fromCurrencyCode: 'USD', toCurrencyCode: 'EUR' });

    expect(result.convertedPriceCents).toBe(9000);
    expect(result.exchangeRate).toBe(0.9);
    expect(result.appliedRules).toEqual([]);
  });

  it('should throw CurrencyNotFoundError when a currency is unknown', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({ priceCents: 10000, fromCurrencyCode: 'USD', toCurrencyCode: 'XXX' }),
    ).rejects.toThrow(CurrencyNotFoundError);
  });

  it('should apply the matching currency rule and record it in appliedRules', async () => {
    const rule = {
      ...createPricingRule({ id: 'fx-rule', name: 'EUR markup' }),
      currencyCode: 'EUR',
      adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 10 }],
    };
    const { useCase } = buildUseCase(createCurrencyPriceRuleQuery([rule]));

    const result = await useCase.execute({ priceCents: 10000, fromCurrencyCode: 'USD', toCurrencyCode: 'EUR' });

    expect(result.convertedPriceCents).toBe(9900);
    expect(result.appliedRules).toHaveLength(1);
    expect(result.appliedRules[0]?.ruleId).toBe('fx-rule');
    expect(result.appliedRules[0]?.impact).toBe(9000 - 9900);
  });
});
