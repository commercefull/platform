import { createCurrency, createPricingRule } from '../../tests/testUtils';
import { UpdateCurrencyPriceRuleUseCase } from './UpdateCurrencyPriceRule';
import { PricingRuleNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';
import type { Currency, CurrencyRegion } from '../../domain/currency';
import type { CurrencyPriceRule } from '../../domain/pricingRule';

type Port = ConstructorParameters<typeof UpdateCurrencyPriceRuleUseCase>[0];

function existingRule(overrides: Partial<CurrencyPriceRule> = {}): CurrencyPriceRule {
  return { ...createPricingRule(), currencyCode: 'USD', ...overrides } as CurrencyPriceRule;
}

function createPort(
  rule: CurrencyPriceRule | null = existingRule(),
  currency: Currency | null = createCurrency(),
  region: CurrencyRegion | null = null,
): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    findById: jest.fn(),
    getCurrencyByCode: jest.fn(),
    getCurrencyRegionByCode: jest.fn(),
    update: jest.fn(),
  };
  port.findById.mockResolvedValue(rule);
  port.getCurrencyByCode.mockResolvedValue(currency);
  port.getCurrencyRegionByCode.mockResolvedValue(region);
  port.update.mockImplementation((id, data) => Promise.resolve({ ...existingRule(), ...data }));
  return port;
}

describe('UpdateCurrencyPriceRuleUseCase', () => {
  it('should update the rule when it exists', async () => {
    const port = createPort();
    const useCase = new UpdateCurrencyPriceRuleUseCase(port);

    const result = await useCase.execute('rule1', { priority: 5 });

    expect(port.update).toHaveBeenCalledWith('rule1', { priority: 5 });
    expect(result.priority).toBe(5);
  });

  it('should throw PricingRuleNotFoundError when the rule does not exist', async () => {
    const port = createPort(null);
    const useCase = new UpdateCurrencyPriceRuleUseCase(port);

    await expect(useCase.execute('missing', { priority: 1 })).rejects.toBeInstanceOf(PricingRuleNotFoundError);
    expect(port.update).not.toHaveBeenCalled();
  });

  it('should validate the new currency when currencyCode changes', async () => {
    const port = createPort(existingRule(), null);
    const useCase = new UpdateCurrencyPriceRuleUseCase(port);

    await expect(useCase.execute('rule1', { currencyCode: 'EUR' })).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.update).not.toHaveBeenCalled();
  });

  it('should validate the new region when regionCode changes', async () => {
    const port = createPort(existingRule(), createCurrency(), null);
    const useCase = new UpdateCurrencyPriceRuleUseCase(port);

    await expect(useCase.execute('rule1', { regionCode: 'APAC' })).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.update).not.toHaveBeenCalled();
  });

  it('should skip currency validation when currencyCode is unchanged', async () => {
    const port = createPort(existingRule(), null);
    const useCase = new UpdateCurrencyPriceRuleUseCase(port);

    await useCase.execute('rule1', { currencyCode: 'USD' });

    expect(port.update).toHaveBeenCalled();
    expect(port.getCurrencyByCode).not.toHaveBeenCalled();
  });
});
