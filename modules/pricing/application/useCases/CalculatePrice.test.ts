import { createPricingRepository } from '../../tests/testUtils';
import { CalculatePriceUseCase } from './CalculatePrice';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

describe('CalculatePriceUseCase', () => {
  it('should use the catalog base price when no rules apply', async () => {
    const pricingRepository = createPricingRepository(10000);

    const result = await new CalculatePriceUseCase(pricingRepository).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(result.unitPriceCents).toBe(10000);
    expect(result.totalPriceCents).toBe(10000);
    expect(result.breakdown.appliedRules).toEqual([]);
  });

  it('should use the currency of the base price row', async () => {
    const pricingRepository = createPricingRepository(10000);
    pricingRepository.getBasePrice.mockResolvedValue({ priceCents: 10000, currencyCode: 'EUR' });

    const result = await new CalculatePriceUseCase(pricingRepository).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(result.currency).toBe('EUR');
  });

  it('should throw PricingValidationError when no base price exists', async () => {
    const pricingRepository = createPricingRepository();
    pricingRepository.getBasePrice.mockResolvedValue(null);

    await expect(
      new CalculatePriceUseCase(pricingRepository).execute({ productId: 'missing', quantity: 1 }),
    ).rejects.toThrow(PricingValidationError);
  });

  it('should resolve the variant price when a variant is given', async () => {
    const pricingRepository = createPricingRepository(15000);

    const result = await new CalculatePriceUseCase(pricingRepository).execute({
      productId: 'p1',
      variantId: 'v1',
      quantity: 1,
    });

    expect(result.unitPriceCents).toBe(15000);
    expect(result.breakdown.basePriceCents).toBe(15000);
    expect(pricingRepository.getBasePrice).toHaveBeenCalledWith('p1', 'v1');
  });

  it('should apply the price list price when a price list matches', async () => {
    const pricingRepository = createPricingRepository(10000);
    pricingRepository.getPriceListItem.mockResolvedValue({ priceCents: 8000 });

    const result = await new CalculatePriceUseCase(pricingRepository).execute({
      productId: 'p1',
      quantity: 1,
      priceListId: 'pl-1',
    });

    expect(result.unitPriceCents).toBe(8000);
    expect(result.breakdown.appliedRules).toContain('price_list:pl-1');
    expect(pricingRepository.getPriceListItem).toHaveBeenCalledWith('pl-1', 'p1', undefined);
  });

  it('should not look up a price list when none is given', async () => {
    const pricingRepository = createPricingRepository(10000);

    await new CalculatePriceUseCase(pricingRepository).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(pricingRepository.getPriceListItem).not.toHaveBeenCalled();
  });

  it('should apply a tier price when the quantity is greater than 1', async () => {
    const pricingRepository = createPricingRepository(10000);
    pricingRepository.getTierPrice.mockResolvedValue({ priceCents: 9000 });

    const result = await new CalculatePriceUseCase(pricingRepository).execute({
      productId: 'p1',
      quantity: 5,
    });

    expect(result.unitPriceCents).toBe(9000);
    expect(result.breakdown.volumeDiscountCents).toBe(1000);
    expect(result.breakdown.appliedRules).toContain('tier_price');
    expect(pricingRepository.getTierPrice).toHaveBeenCalledWith('p1', 5, undefined);
  });

  it('should not look up tier prices when the quantity is 1', async () => {
    const pricingRepository = createPricingRepository(10000);

    await new CalculatePriceUseCase(pricingRepository).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(pricingRepository.getTierPrice).not.toHaveBeenCalled();
  });

  it('should apply the sale price when it is lower than the calculated price', async () => {
    const pricingRepository = createPricingRepository(10000);
    pricingRepository.getBasePrice.mockResolvedValue({ priceCents: 10000, salePriceCents: 7500, currencyCode: 'USD' });

    const result = await new CalculatePriceUseCase(pricingRepository).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(result.unitPriceCents).toBe(7500);
    expect(result.breakdown.appliedRules).toContain('sale_price');
  });

  it('should keep the calculated price when the sale price is higher', async () => {
    const pricingRepository = createPricingRepository(10000);
    pricingRepository.getBasePrice.mockResolvedValue({ priceCents: 10000, salePriceCents: 12000, currencyCode: 'USD' });

    const result = await new CalculatePriceUseCase(pricingRepository).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(result.unitPriceCents).toBe(10000);
    expect(result.breakdown.appliedRules).not.toContain('sale_price');
  });

  it('should multiply the unit price by the quantity when calculating the total', async () => {
    const result = await new CalculatePriceUseCase(createPricingRepository(10000)).execute({
      productId: 'p1',
      quantity: 3,
    });

    expect(result.totalPriceCents).toBe(30000);
  });
});
