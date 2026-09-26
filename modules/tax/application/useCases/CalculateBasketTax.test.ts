import { CalculateBasketTaxUseCase } from './CalculateBasketTax';
import { TaxableBasketNotFoundError, TaxValidationError } from '../../domain/errors/TaxErrors';
import type { TaxableBasketPort } from '../ports/TaxableBasketPort';

type CalcPort = ConstructorParameters<typeof CalculateBasketTaxUseCase>[1];

function createBasketPort(): jest.Mocked<TaxableBasketPort> {
  const port: jest.Mocked<TaxableBasketPort> = {
    findById: jest.fn(),
  };
  port.findById.mockResolvedValue({
    basketId: 'b1',
    items: [
      { productId: 'p1', quantity: 2, priceCents: 1000 },
      { productId: 'p2', quantity: 1, priceCents: 500 },
    ],
    subtotalCents: 2500,
  });
  return port;
}

function createCalcPort(withLegacy = true): jest.Mocked<CalcPort> {
  const port: jest.Mocked<CalcPort> = {
    calculateComplexTax: jest.fn(),
  };
  if (withLegacy) {
    port.calculateTaxForBasket = jest.fn().mockResolvedValue({ legacy: true });
  }
  port.calculateComplexTax.mockResolvedValue({ complex: true });
  return port;
}

const command = {
  basketId: 'b1',
  shippingAddress: { country: 'US', region: 'CA' },
  customerId: 'c1',
};

describe('CalculateBasketTaxUseCase', () => {
  it('should use the legacy basket calculation when available', async () => {
    const calcPort = createCalcPort();
    const basketPort = createBasketPort();
    const useCase = new CalculateBasketTaxUseCase(basketPort, calcPort);

    const result = await useCase.execute(command);

    expect(result).toEqual({ legacy: true });
    expect(basketPort.findById).not.toHaveBeenCalled();
    expect(calcPort.calculateComplexTax).not.toHaveBeenCalled();
  });

  it('should load the basket and run the complex calculation when the legacy method is absent', async () => {
    const calcPort = createCalcPort(false);
    const basketPort = createBasketPort();
    const useCase = new CalculateBasketTaxUseCase(basketPort, calcPort);

    const result = await useCase.execute(command);

    expect(result).toEqual({ complex: true });
    expect(calcPort.calculateComplexTax).toHaveBeenCalledWith(
      [
        { product_id: 'p1', quantity: 2, priceCents: 1000, tax_category_id: undefined },
        { product_id: 'p2', quantity: 1, priceCents: 500, tax_category_id: undefined },
      ],
      expect.objectContaining({ country: 'US' }),
      expect.objectContaining({ country: 'US' }),
      2500,
      0,
      'c1',
      undefined,
    );
  });

  it('should throw TaxableBasketNotFoundError when the basket does not exist', async () => {
    const calcPort = createCalcPort(false);
    const basketPort = createBasketPort();
    basketPort.findById.mockResolvedValue(null);
    const useCase = new CalculateBasketTaxUseCase(basketPort, calcPort);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(TaxableBasketNotFoundError);
  });

  it('should throw TaxValidationError when shipping country is missing', async () => {
    const calcPort = createCalcPort();
    const basketPort = createBasketPort();
    const useCase = new CalculateBasketTaxUseCase(basketPort, calcPort);

    await expect(useCase.execute({ ...command, shippingAddress: { country: '' } })).rejects.toBeInstanceOf(
      TaxValidationError,
    );
  });
});
