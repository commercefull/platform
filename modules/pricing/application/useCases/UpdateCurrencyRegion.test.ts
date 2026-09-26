import { createCurrency } from '../../tests/testUtils';
import { UpdateCurrencyRegionUseCase } from './UpdateCurrencyRegion';
import { CurrencyRegionNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';
import type { Currency, CurrencyRegion } from '../../domain/currency';

type Port = ConstructorParameters<typeof UpdateCurrencyRegionUseCase>[0];

function createRegion(overrides: Partial<CurrencyRegion> = {}): CurrencyRegion {
  return {
    currencyRegionId: 'cr1',
    code: 'NA',
    name: 'North America',
    currencyCode: 'USD',
    isActive: true,
    ...overrides,
  };
}

function createPort(
  region: CurrencyRegion | null = createRegion(),
  currency: Currency | null = createCurrency(),
): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    getCurrencyRegionById: jest.fn(),
    getCurrencyByCode: jest.fn(),
    updateCurrencyRegion: jest.fn(),
  };
  port.getCurrencyRegionById.mockResolvedValue(region);
  port.getCurrencyByCode.mockResolvedValue(currency);
  port.updateCurrencyRegion.mockImplementation((id, data) => Promise.resolve({ ...createRegion(), ...data }));
  return port;
}

describe('UpdateCurrencyRegionUseCase', () => {
  it('should update the region when it exists', async () => {
    const port = createPort();
    const useCase = new UpdateCurrencyRegionUseCase(port);

    const result = await useCase.execute('cr1', { name: 'Americas' });

    expect(result.name).toBe('Americas');
  });

  it('should throw CurrencyRegionNotFoundError when the region does not exist', async () => {
    const port = createPort(null);
    const useCase = new UpdateCurrencyRegionUseCase(port);

    await expect(useCase.execute('missing', { name: 'x' })).rejects.toBeInstanceOf(CurrencyRegionNotFoundError);
    expect(port.updateCurrencyRegion).not.toHaveBeenCalled();
  });

  it('should validate the new currency when currencyCode changes', async () => {
    const port = createPort(createRegion(), null);
    const useCase = new UpdateCurrencyRegionUseCase(port);

    await expect(useCase.execute('cr1', { currencyCode: 'EUR' })).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.updateCurrencyRegion).not.toHaveBeenCalled();
  });

  it('should skip currency validation when currencyCode is unchanged', async () => {
    const port = createPort(createRegion(), null);
    const useCase = new UpdateCurrencyRegionUseCase(port);

    await useCase.execute('cr1', { currencyCode: 'USD' });

    expect(port.updateCurrencyRegion).toHaveBeenCalled();
    expect(port.getCurrencyByCode).not.toHaveBeenCalled();
  });
});
