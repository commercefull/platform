jest.mock('../../infrastructure/repositories/ProductVariantRepository', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn().mockResolvedValue({
      data: [
        { variantId: 'v1', productId: 'p1', sku: 'SKU-1', name: 'Red', attributes: [],
          price: { effectivePrice: 10, currency: 'USD', salePrice: null, cost: null, isOnSale: false, discountPercentage: 0 },
          stockQuantity: 50, lowStockThreshold: 5, isDefault: true, isActive: true, position: 0,
          isInStock: true, isLowStock: false, isOutOfStock: false },
      ],
      total: 1,
    }),
  },
}));

import { GetProductVariantsUseCase, GetProductVariantsCommand } from './GetProductVariants';
import ProductVariantRepository from '../../infrastructure/repositories/ProductVariantRepository';

const mockRepo = ProductVariantRepository as unknown as Record<string, jest.Mock>;

describe('GetProductVariantsUseCase', () => {
  let useCase: GetProductVariantsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetProductVariantsUseCase(mockRepo as never);
  });

  it('should get product variants (happy path)', async () => {
    const result = await useCase.execute(new GetProductVariantsCommand('p1'));

    expect(result).toHaveLength(1);
    expect(result[0].variantId).toBe('v1');
  });

  it('should include inactive variants when requested', async () => {
    await useCase.execute(new GetProductVariantsCommand('p1', true));

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1' }),
      expect.objectContaining({ orderBy: 'sortOrder' }),
    );
  });
});
