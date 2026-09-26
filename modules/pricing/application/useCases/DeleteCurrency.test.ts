import { createCurrency } from '../../tests/testUtils';
import { DeleteCurrencyUseCase } from './DeleteCurrency';
import { CurrencyNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';
import type { Currency } from '../../domain/currency';

type Port = ConstructorParameters<typeof DeleteCurrencyUseCase>[0];

function createPort(existing: Currency | null): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    getCurrencyByCode: jest.fn(),
    deleteCurrency: jest.fn(),
  };
  port.getCurrencyByCode.mockResolvedValue(existing);
  port.deleteCurrency.mockResolvedValue(true);
  return port;
}

describe('DeleteCurrencyUseCase', () => {
  it('should delete a non-default currency when it exists', async () => {
    const port = createPort(createCurrency({ code: 'EUR', isDefault: false }));
    const useCase = new DeleteCurrencyUseCase(port);

    await useCase.execute('EUR');

    expect(port.deleteCurrency).toHaveBeenCalledWith('EUR');
  });

  it('should throw CurrencyNotFoundError when the currency does not exist', async () => {
    const port = createPort(null);
    const useCase = new DeleteCurrencyUseCase(port);

    await expect(useCase.execute('XXX')).rejects.toBeInstanceOf(CurrencyNotFoundError);
    expect(port.deleteCurrency).not.toHaveBeenCalled();
  });

  it('should throw PricingValidationError when deleting the default currency', async () => {
    const port = createPort(createCurrency({ isDefault: true }));
    const useCase = new DeleteCurrencyUseCase(port);

    await expect(useCase.execute('USD')).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.deleteCurrency).not.toHaveBeenCalled();
  });
});
