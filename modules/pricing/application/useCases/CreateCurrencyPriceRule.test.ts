import { createCurrency, createPricingRule } from '../../tests/testUtils';
import { CreateCurrencyPriceRuleUseCase } from './CreateCurrencyPriceRule';
import { PricingValidationError } from '../../domain/errors/PricingErrors';
import { PricingAdjustmentType, PricingRuleScope, PricingRuleStatus, PricingRuleType } from '../../domain/pricingRule';
import type { CurrencyPriceRule, CurrencyPriceRuleCreateProps } from '../../domain/pricingRule';
import type { Currency, CurrencyRegion } from '../../domain/currency';

type Port = ConstructorParameters<typeof CreateCurrencyPriceRuleUseCase>[0];

function createProps(overrides: Partial<CurrencyPriceRuleCreateProps> = {}): CurrencyPriceRuleCreateProps {
  return {
    name: 'EUR markup',
    type: PricingRuleType.DYNAMIC,
    scope: PricingRuleScope.GLOBAL,
    status: PricingRuleStatus.ACTIVE,
    priority: 1,
    conditions: [],
    adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 5 }],
    currencyCode: 'EUR',
    ...overrides,
  };
}

function createPort(
  currency: Currency | null = createCurrency({ code: 'EUR', isDefault: false }),
  region: CurrencyRegion | null = null,
): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    getCurrencyByCode: jest.fn(),
    getCurrencyRegionByCode: jest.fn(),
    create: jest.fn(),
  };
  port.getCurrencyByCode.mockResolvedValue(currency);
  port.getCurrencyRegionByCode.mockResolvedValue(region);
  port.create.mockImplementation(data => Promise.resolve({ ...createPricingRule(), ...data, id: 'cpr1' } as CurrencyPriceRule));
  return port;
}

describe('CreateCurrencyPriceRuleUseCase', () => {
  it('should create the rule when fields and currency are valid', async () => {
    const port = createPort();
    const useCase = new CreateCurrencyPriceRuleUseCase(port);

    const result = await useCase.execute(createProps());

    expect(result.id).toBe('cpr1');
    expect(port.create).toHaveBeenCalled();
  });

  it('should throw PricingValidationError when required fields are missing', async () => {
    const port = createPort();
    const useCase = new CreateCurrencyPriceRuleUseCase(port);

    await expect(useCase.execute(createProps({ currencyCode: '' }))).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.create).not.toHaveBeenCalled();
  });

  it('should throw PricingValidationError when no adjustments are provided', async () => {
    const port = createPort();
    const useCase = new CreateCurrencyPriceRuleUseCase(port);

    await expect(useCase.execute(createProps({ adjustments: [] }))).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.create).not.toHaveBeenCalled();
  });

  it('should throw PricingValidationError when the currency does not exist', async () => {
    const port = createPort(null);
    const useCase = new CreateCurrencyPriceRuleUseCase(port);

    await expect(useCase.execute(createProps())).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.create).not.toHaveBeenCalled();
  });

  it('should throw PricingValidationError when the region does not exist', async () => {
    const port = createPort();
    const useCase = new CreateCurrencyPriceRuleUseCase(port);

    await expect(useCase.execute(createProps({ regionCode: 'NA' }))).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.create).not.toHaveBeenCalled();
  });

  it('should create the rule when the region exists', async () => {
    const port = createPort(createCurrency({ code: 'EUR', isDefault: false }), {
      currencyRegionId: 'cr1',
      code: 'NA',
      currencyCode: 'EUR',
      isActive: true,
    });
    const useCase = new CreateCurrencyPriceRuleUseCase(port);

    await useCase.execute(createProps({ regionCode: 'NA' }));

    expect(port.create).toHaveBeenCalled();
  });
});
