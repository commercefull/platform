import { createCurrency } from '../../tests/testUtils';
import { CreateCurrencyRegionUseCase } from './CreateCurrencyRegion';
import { PricingValidationError } from '../../domain/errors/PricingErrors';
import type { Currency, CurrencyRegion } from '../../domain/currency';

type Port = ConstructorParameters<typeof CreateCurrencyRegionUseCase>[0];

function createRegion(overrides: Partial<CurrencyRegion> = {}): CurrencyRegion {
  return {
    code: 'NA',
    name: 'North America',
    currencyCode: 'USD',
    isActive: true,
    ...overrides,
  };
}

function createPort(currency: Currency | null = createCurrency()): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    getCurrencyByCode: jest.fn(),
    createCurrencyRegion: jest.fn(),
  };
  port.getCurrencyByCode.mockResolvedValue(currency);
  port.createCurrencyRegion.mockImplementation(r => Promise.resolve({ ...r, currencyRegionId: 'cr1' }));
  return port;
}

describe('CreateCurrencyRegionUseCase', () => {
  it('should create a region when required fields are present and the currency exists', async () => {
    const port = createPort();
    const useCase = new CreateCurrencyRegionUseCase(port);

    const result = await useCase.execute(createRegion());

    expect(port.createCurrencyRegion).toHaveBeenCalled();
    expect(result.currencyRegionId).toBe('cr1');
  });

  it('should throw PricingValidationError when required fields are missing', async () => {
    const port = createPort();
    const useCase = new CreateCurrencyRegionUseCase(port);

    await expect(useCase.execute(createRegion({ code: undefined }))).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.createCurrencyRegion).not.toHaveBeenCalled();
  });

  it('should throw PricingValidationError when the currency does not exist', async () => {
    const port = createPort(null);
    const useCase = new CreateCurrencyRegionUseCase(port);

    await expect(useCase.execute(createRegion({ currencyCode: 'XXX' }))).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.createCurrencyRegion).not.toHaveBeenCalled();
  });
});
