import { CalculateLineItemTaxUseCase } from './CalculateLineItemTax';
import { TaxValidationError } from '../../domain/errors/TaxErrors';

type Port = ConstructorParameters<typeof CalculateLineItemTaxUseCase>[0];

function createPort(withLegacy = true): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    calculateComplexTax: jest.fn(),
  };
  if (withLegacy) {
    port.calculateTaxForLineItem = jest.fn().mockResolvedValue({
      taxAmountCents: 200,
      rate: 10,
      taxableAmountCents: 2000,
      totalCents: 2200,
    });
  }
  port.calculateComplexTax.mockResolvedValue({ complex: true });
  return port;
}

const command = {
  productId: 'p1',
  quantity: 2,
  priceCents: 1000,
  shippingAddress: { country: 'US' },
};

describe('CalculateLineItemTaxUseCase', () => {
  it('should use the legacy line-item calculation when available', async () => {
    const port = createPort();
    const useCase = new CalculateLineItemTaxUseCase(port);

    const result = (await useCase.execute(command)) as { taxAmountCents: number; taxBreakdown: unknown[] };

    expect(result.taxAmountCents).toBe(200);
    expect(result.taxBreakdown).toHaveLength(1);
    expect(port.calculateComplexTax).not.toHaveBeenCalled();
  });

  it('should fall back to the complex calculation when the legacy method is absent', async () => {
    const port = createPort(false);
    const useCase = new CalculateLineItemTaxUseCase(port);

    const result = await useCase.execute(command);

    expect(result).toEqual({ complex: true });
    expect(port.calculateComplexTax).toHaveBeenCalledWith(
      [expect.objectContaining({ product_id: 'p1', quantity: 2, priceCents: 1000 })],
      expect.objectContaining({ country: 'US' }),
      expect.objectContaining({ country: 'US' }),
      2000,
      0,
      undefined,
      undefined,
    );
  });

  it('should throw TaxValidationError when required fields are missing', async () => {
    const port = createPort();
    const useCase = new CalculateLineItemTaxUseCase(port);

    await expect(useCase.execute({ ...command, productId: undefined })).rejects.toBeInstanceOf(TaxValidationError);
    await expect(useCase.execute({ ...command, shippingAddress: { country: '' } })).rejects.toBeInstanceOf(
      TaxValidationError,
    );
  });

  it('should throw TaxValidationError when quantity is not a positive number', async () => {
    const port = createPort();
    const useCase = new CalculateLineItemTaxUseCase(port);

    await expect(useCase.execute({ ...command, quantity: 0 })).rejects.toBeInstanceOf(TaxValidationError);
  });

  it('should throw TaxValidationError when price is negative', async () => {
    const port = createPort();
    const useCase = new CalculateLineItemTaxUseCase(port);

    await expect(useCase.execute({ ...command, priceCents: -5 })).rejects.toBeInstanceOf(TaxValidationError);
  });
});
