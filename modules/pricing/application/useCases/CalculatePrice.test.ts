import { CalculatePriceUseCase } from './CalculatePrice';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

describe('CalculatePriceUseCase', () => {
  let useCase: CalculatePriceUseCase;
  let mockPricingRepo: Record<string, jest.Mock>;
  let mockProductRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockPricingRepo = {
      getPriceListItem: jest.fn().mockResolvedValue(null),
      getVolumeDiscount: jest.fn().mockResolvedValue(null),
      getActiveSalePrice: jest.fn().mockResolvedValue(null),
    };
    mockProductRepo = {
      findById: jest.fn().mockResolvedValue({ price: 100, currencyCode: 'USD' }),
      findVariantById: jest.fn().mockResolvedValue(null),
    };
    useCase = new CalculatePriceUseCase(mockPricingRepo as never, mockProductRepo as never);
  });

  it('should calculate base price (happy path)', async () => {
    const result = await useCase.execute({ productId: 'p1', quantity: 1 });

    expect(result.unitPrice).toBe(100);
    expect(result.totalPrice).toBe(100);
    expect(result.currency).toBe('USD');
    expect(result.breakdown.appliedRules).toEqual([]);
  });

  it('should throw PricingValidationError when product not found', async () => {
    mockProductRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ productId: 'missing', quantity: 1 })).rejects.toThrow(PricingValidationError);
  });

  it('should use variant price when available', async () => {
    mockProductRepo.findVariantById.mockResolvedValue({ price: 150 });

    const result = await useCase.execute({ productId: 'p1', variantId: 'v1', quantity: 1 });

    expect(result.unitPrice).toBe(150);
    expect(result.breakdown.basePrice).toBe(150);
  });

  it('should apply price list override', async () => {
    mockPricingRepo.getPriceListItem.mockResolvedValue({ price: 80 });

    const result = await useCase.execute({ productId: 'p1', quantity: 1, priceListId: 'pl-1' });

    expect(result.unitPrice).toBe(80);
    expect(result.breakdown.appliedRules).toContain('price_list:pl-1');
  });

  it('should apply volume discount for quantity > 1', async () => {
    mockPricingRepo.getVolumeDiscount.mockResolvedValue({ discountPercent: 10 });

    const result = await useCase.execute({ productId: 'p1', quantity: 5 });

    expect(result.unitPrice).toBe(90);
    expect(result.breakdown.appliedRules).toContain('volume_discount:10%');
  });

  it('should apply sale price when lower than calculated price', async () => {
    mockPricingRepo.getActiveSalePrice.mockResolvedValue(75);

    const result = await useCase.execute({ productId: 'p1', quantity: 1 });

    expect(result.unitPrice).toBe(75);
    expect(result.breakdown.appliedRules).toContain('sale_price');
  });

  it('should not apply sale price when higher than calculated price', async () => {
    mockPricingRepo.getActiveSalePrice.mockResolvedValue(120);

    const result = await useCase.execute({ productId: 'p1', quantity: 1 });

    expect(result.unitPrice).toBe(100);
    expect(result.breakdown.appliedRules).not.toContain('sale_price');
  });

  it('should calculate total price as unit * quantity', async () => {
    const result = await useCase.execute({ productId: 'p1', quantity: 3 });

    expect(result.totalPrice).toBe(300);
  });
});
