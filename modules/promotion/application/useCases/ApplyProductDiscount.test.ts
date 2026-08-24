jest.mock('../../infrastructure/repositories/CouponDiscountRepository', () => ({
  __esModule: true,
  default: {
    discounts: {
      findActive: jest.fn().mockResolvedValue([]),
      findDiscountsForProduct: jest.fn().mockResolvedValue([]),
    },
    coupons: {},
  },
}));

import { ApplyProductDiscountUseCase, ApplyProductDiscountCommand } from './ApplyProductDiscount';

describe('ApplyProductDiscountUseCase', () => {
  let useCase: ApplyProductDiscountUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ApplyProductDiscountUseCase();
  });

  it('should return empty result for no items', async () => {
    const result = await useCase.execute(new ApplyProductDiscountCommand([]));

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(0);
    expect(result.totalOriginal).toBe(0);
  });

  it('should process items with no active discounts', async () => {
    const result = await useCase.execute(new ApplyProductDiscountCommand([
      { productId: 'p1', price: 100, quantity: 2 },
    ]));

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].totalDiscount).toBe(0);
    expect(result.items[0].finalPrice).toBe(100);
  });
});
