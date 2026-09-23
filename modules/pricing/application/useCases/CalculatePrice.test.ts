import { createPricingRepository, createProductRepository } from '../../tests/testUtils';
import { CalculatePriceUseCase } from './CalculatePrice';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

describe('CalculatePriceUseCase', () => {
  it('should use the product base price when no rules apply', async () => {
    const pricingRepository = createPricingRepository();
    const productRepository = createProductRepository(100);

    const result = await new CalculatePriceUseCase(pricingRepository, productRepository).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(result.unitPrice).toBe(100);
    expect(result.totalPrice).toBe(100);
    expect(result.breakdown.appliedRules).toEqual([]);
  });

  it('should default the currency to USD when the product has no currency code', async () => {
    const result = await new CalculatePriceUseCase(createPricingRepository(), createProductRepository(100)).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(result.currency).toBe('USD');
  });

  it('should use the product currency when one is set', async () => {
    const productRepository = createProductRepository(100);
    productRepository.findById.mockResolvedValue({ price: 100, currencyCode: 'EUR' });

    const result = await new CalculatePriceUseCase(createPricingRepository(), productRepository).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(result.currency).toBe('EUR');
  });

  it('should throw PricingValidationError when the product is not found', async () => {
    const productRepository = createProductRepository();
    productRepository.findById.mockResolvedValue(null);

    await expect(
      new CalculatePriceUseCase(createPricingRepository(), productRepository).execute({ productId: 'missing', quantity: 1 }),
    ).rejects.toThrow(PricingValidationError);
  });

  it('should use the variant price when a variant is given', async () => {
    const productRepository = createProductRepository(100);
    productRepository.findVariantById.mockResolvedValue({ price: 150 });

    const result = await new CalculatePriceUseCase(createPricingRepository(), productRepository).execute({
      productId: 'p1',
      variantId: 'v1',
      quantity: 1,
    });

    expect(result.unitPrice).toBe(150);
    expect(result.breakdown.basePrice).toBe(150);
    expect(productRepository.findVariantById).toHaveBeenCalledWith('v1');
  });

  it('should keep the product price when the variant has no price', async () => {
    const productRepository = createProductRepository(100);
    productRepository.findVariantById.mockResolvedValue({});

    const result = await new CalculatePriceUseCase(createPricingRepository(), productRepository).execute({
      productId: 'p1',
      variantId: 'v1',
      quantity: 1,
    });

    expect(result.unitPrice).toBe(100);
  });

  it('should apply the price list price when a price list matches', async () => {
    const pricingRepository = createPricingRepository();
    pricingRepository.getPriceListItem.mockResolvedValue({ price: 80 });

    const result = await new CalculatePriceUseCase(pricingRepository, createProductRepository(100)).execute({
      productId: 'p1',
      quantity: 1,
      priceListId: 'pl-1',
    });

    expect(result.unitPrice).toBe(80);
    expect(result.breakdown.appliedRules).toContain('price_list:pl-1');
    expect(pricingRepository.getPriceListItem).toHaveBeenCalledWith('pl-1', 'p1', undefined);
  });

  it('should not look up a price list when none is given', async () => {
    const pricingRepository = createPricingRepository();

    await new CalculatePriceUseCase(pricingRepository, createProductRepository(100)).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(pricingRepository.getPriceListItem).not.toHaveBeenCalled();
  });

  it('should apply a volume discount when the quantity is greater than 1', async () => {
    const pricingRepository = createPricingRepository();
    pricingRepository.getVolumeDiscount.mockResolvedValue({ discountPercent: 10 });

    const result = await new CalculatePriceUseCase(pricingRepository, createProductRepository(100)).execute({
      productId: 'p1',
      quantity: 5,
    });

    expect(result.unitPrice).toBe(90);
    expect(result.breakdown.appliedRules).toContain('volume_discount:10%');
    expect(pricingRepository.getVolumeDiscount).toHaveBeenCalledWith('p1', 5);
  });

  it('should not look up volume discounts when the quantity is 1', async () => {
    const pricingRepository = createPricingRepository();

    await new CalculatePriceUseCase(pricingRepository, createProductRepository(100)).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(pricingRepository.getVolumeDiscount).not.toHaveBeenCalled();
  });

  it('should apply the sale price when it is lower than the calculated price', async () => {
    const pricingRepository = createPricingRepository();
    pricingRepository.getActiveSalePrice.mockResolvedValue(75);

    const result = await new CalculatePriceUseCase(pricingRepository, createProductRepository(100)).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(result.unitPrice).toBe(75);
    expect(result.breakdown.appliedRules).toContain('sale_price');
  });

  it('should keep the calculated price when the sale price is higher', async () => {
    const pricingRepository = createPricingRepository();
    pricingRepository.getActiveSalePrice.mockResolvedValue(120);

    const result = await new CalculatePriceUseCase(pricingRepository, createProductRepository(100)).execute({
      productId: 'p1',
      quantity: 1,
    });

    expect(result.unitPrice).toBe(100);
    expect(result.breakdown.appliedRules).not.toContain('sale_price');
  });

  it('should multiply the unit price by the quantity when calculating the total', async () => {
    const result = await new CalculatePriceUseCase(createPricingRepository(), createProductRepository(100)).execute({
      productId: 'p1',
      quantity: 3,
    });

    expect(result.totalPrice).toBe(300);
  });
});
