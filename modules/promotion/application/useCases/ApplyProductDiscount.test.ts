import '../../tests/testUtils';
import { ApplyProductDiscountUseCase, ApplyProductDiscountCommand } from './ApplyProductDiscount';
import { createDiscountRepository, createProductDiscount } from '../../tests/testUtils';

describe('ApplyProductDiscountUseCase', () => {
  const discountRepository = createDiscountRepository();
  const useCase = new ApplyProductDiscountUseCase(discountRepository);

  beforeEach(() => {
    jest.resetAllMocks();
    discountRepository.findDiscountsForProduct.mockResolvedValue([]);
    discountRepository.calculateDiscount.mockReturnValue(10);
  });

  it('should return an empty result when there are no items', async () => {
    const result = await useCase.execute(new ApplyProductDiscountCommand([]));

    expect(result.success).toBe(true);
    expect(result.items).toEqual([]);
    expect(result.totalFinal).toBe(0);
    expect(discountRepository.findDiscountsForProduct).not.toHaveBeenCalled();
  });

  it('should return zero discount when no discounts apply to the product', async () => {
    const result = await useCase.execute(new ApplyProductDiscountCommand([{ productId: 'p1', price: 50, quantity: 2 }]));

    expect(result.success).toBe(true);
    expect(result.totalOriginal).toBe(100);
    expect(result.totalDiscount).toBe(0);
    expect(result.totalFinal).toBe(100);
    expect(result.items[0].finalPrice).toBe(50);
    expect(discountRepository.findDiscountsForProduct).toHaveBeenCalledWith('p1', undefined);
  });

  it('should apply only the best non-stackable discount', async () => {
    discountRepository.findDiscountsForProduct.mockResolvedValue([
      createProductDiscount({ promotionProductDiscountId: 'best', stackable: false }),
      createProductDiscount({ promotionProductDiscountId: 'ignored', stackable: false }),
    ]);
    discountRepository.calculateDiscount.mockReturnValueOnce(15);

    const result = await useCase.execute(new ApplyProductDiscountCommand([{ productId: 'p1', price: 100, quantity: 1 }]));

    expect(result.totalDiscount).toBe(15);
    expect(result.items[0].discounts).toHaveLength(1);
    expect(result.items[0].discounts[0].discountId).toBe('best');
    expect(result.appliedDiscounts).toEqual(['best']);
  });

  it('should apply all stackable discounts on top of the best non-stackable one', async () => {
    discountRepository.findDiscountsForProduct.mockResolvedValue([
      createProductDiscount({ promotionProductDiscountId: 'base', stackable: false }),
      createProductDiscount({ promotionProductDiscountId: 'stack-1', stackable: true }),
      createProductDiscount({ promotionProductDiscountId: 'stack-2', stackable: true }),
    ]);
    discountRepository.calculateDiscount.mockReturnValue(10);

    const result = await useCase.execute(new ApplyProductDiscountCommand([{ productId: 'p1', price: 100, quantity: 1 }]));

    expect(result.items[0].discounts).toHaveLength(3);
    expect(result.appliedDiscounts.sort()).toEqual(['base', 'stack-1', 'stack-2']);
    expect(result.totalDiscount).toBe(30);
  });

  it('should cap the total discount at the item total', async () => {
    discountRepository.findDiscountsForProduct.mockResolvedValue([
      createProductDiscount({ promotionProductDiscountId: 'big', stackable: true }),
    ]);
    discountRepository.calculateDiscount.mockReturnValue(150);

    const result = await useCase.execute(new ApplyProductDiscountCommand([{ productId: 'p1', price: 100, quantity: 1 }]));

    expect(result.totalDiscount).toBe(100);
    expect(result.items[0].finalPrice).toBe(0);
  });

  it('should skip stackable discounts that calculate to zero', async () => {
    discountRepository.findDiscountsForProduct.mockResolvedValue([
      createProductDiscount({ promotionProductDiscountId: 'zero', stackable: true }),
    ]);
    discountRepository.calculateDiscount.mockReturnValue(0);

    const result = await useCase.execute(new ApplyProductDiscountCommand([{ productId: 'p1', price: 100, quantity: 1 }]));

    expect(result.items[0].discounts).toHaveLength(0);
    expect(result.appliedDiscounts).toEqual([]);
  });
});
