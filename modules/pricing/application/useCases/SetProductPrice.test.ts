import { createSetPriceRepository } from '../../tests/testUtils';
import { SetProductPriceUseCase } from './SetProductPrice';
import { PriceMustBePositiveError, InvalidPriceError, PricingValidationError } from '../../domain/errors/PricingErrors';

describe('SetProductPriceUseCase', () => {
  it('should set the price when the input is valid', async () => {
    const repository = createSetPriceRepository();

    const result = await new SetProductPriceUseCase(repository).execute({ productId: 'p1', price: 100, salePrice: 80 });

    expect(result.productId).toBe('p1');
    expect(result.price).toBe(100);
    expect(result.salePrice).toBe(80);
    expect(repository.setPrice).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', price: 100, salePrice: 80, currencyCode: 'USD' }),
    );
  });

  it('should format updatedAt as an ISO string when the price is saved', async () => {
    const result = await new SetProductPriceUseCase(createSetPriceRepository()).execute({ productId: 'p1', price: 100 });

    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should pass the currency through when provided', async () => {
    const repository = createSetPriceRepository();

    await new SetProductPriceUseCase(repository).execute({ productId: 'p1', price: 100, currencyCode: 'EUR' });

    expect(repository.setPrice).toHaveBeenCalledWith(expect.objectContaining({ currencyCode: 'EUR' }));
  });

  it('should throw PricingValidationError when the productId is empty', async () => {
    const repository = createSetPriceRepository();

    await expect(new SetProductPriceUseCase(repository).execute({ productId: '', price: 100 })).rejects.toThrow(
      PricingValidationError,
    );
    expect(repository.setPrice).not.toHaveBeenCalled();
  });

  it('should throw PriceMustBePositiveError when the price is negative', async () => {
    const repository = createSetPriceRepository();

    await expect(new SetProductPriceUseCase(repository).execute({ productId: 'p1', price: -10 })).rejects.toThrow(
      PriceMustBePositiveError,
    );
    expect(repository.setPrice).not.toHaveBeenCalled();
  });

  it('should throw InvalidPriceError when the sale price is not below the price', async () => {
    const repository = createSetPriceRepository();

    await expect(new SetProductPriceUseCase(repository).execute({ productId: 'p1', price: 50, salePrice: 50 })).rejects.toThrow(
      InvalidPriceError,
    );
    expect(repository.setPrice).not.toHaveBeenCalled();
  });
});
