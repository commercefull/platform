import { createCurrency } from '../../tests/testUtils';
import { SaveCurrencyUseCase } from './SaveCurrency';
import type { Currency } from '../../domain/currency';

type Port = ConstructorParameters<typeof SaveCurrencyUseCase>[0];

function createPort(existing: Currency | null = null): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    getCurrencyByCode: jest.fn(),
    saveCurrency: jest.fn(),
  };
  port.getCurrencyByCode.mockResolvedValue(existing);
  port.saveCurrency.mockImplementation(c => Promise.resolve(c));
  return port;
}

describe('SaveCurrencyUseCase', () => {
  it('should report created=true when the currency does not exist yet', async () => {
    const port = createPort();
    const useCase = new SaveCurrencyUseCase(port);

    const result = await useCase.execute(createCurrency({ code: 'EUR' }));

    expect(result.created).toBe(true);
    expect(result.currency.code).toBe('EUR');
    expect(port.saveCurrency).toHaveBeenCalled();
  });

  it('should report created=false when the currency already exists', async () => {
    const port = createPort(createCurrency({ code: 'EUR' }));
    const useCase = new SaveCurrencyUseCase(port);

    const result = await useCase.execute(createCurrency({ code: 'EUR' }));

    expect(result.created).toBe(false);
  });
});
