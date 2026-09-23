import { createPriceListRepository } from '../../tests/testUtils';
import { CreatePriceListUseCase } from './CreatePriceList';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

describe('CreatePriceListUseCase', () => {
  it('should create the price list when the input is valid', async () => {
    const repository = createPriceListRepository();

    const result = await new CreatePriceListUseCase(repository).execute({
      name: 'Retail',
      currencyCode: 'USD',
      type: 'standard',
    });

    expect(result.priceListId).toMatch(/^pl_/);
    expect(result.name).toBe('Retail');
    expect(repository.createPriceList).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Retail', currencyCode: 'USD', type: 'standard', isDefault: false, isActive: true, storeIds: [] }),
    );
  });

  it('should pass optional fields through when provided', async () => {
    const repository = createPriceListRepository();

    await new CreatePriceListUseCase(repository).execute({
      name: 'VIP',
      currencyCode: 'EUR',
      type: 'promotional',
      isDefault: true,
      description: 'VIP pricing',
      storeIds: ['store-1'],
    });

    expect(repository.createPriceList).toHaveBeenCalledWith(
      expect.objectContaining({ isDefault: true, description: 'VIP pricing', storeIds: ['store-1'], currencyCode: 'EUR' }),
    );
  });

  it('should throw PricingValidationError when the name is empty', async () => {
    const repository = createPriceListRepository();

    await expect(
      new CreatePriceListUseCase(repository).execute({ name: '', currencyCode: 'USD', type: 'standard' }),
    ).rejects.toThrow(PricingValidationError);
    expect(repository.createPriceList).not.toHaveBeenCalled();
  });

  it('should throw PricingValidationError when the currencyCode is empty', async () => {
    const repository = createPriceListRepository();

    await expect(
      new CreatePriceListUseCase(repository).execute({ name: 'Test', currencyCode: '', type: 'standard' }),
    ).rejects.toThrow(PricingValidationError);
    expect(repository.createPriceList).not.toHaveBeenCalled();
  });
});
