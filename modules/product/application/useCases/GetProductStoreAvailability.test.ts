jest.mock('../../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue([]),
}));

import { GetProductStoreAvailabilityUseCase } from './GetProductStoreAvailability';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';

const mockProductRepository = {
  findById: jest.fn().mockResolvedValue({ productId: 'p1', sku: 'SKU1' }),
  findVariantById: jest.fn().mockResolvedValue({ productVariantId: 'v1', sku: 'VAR-SKU1' }),
  getDefaultVariant: jest.fn().mockResolvedValue({ productVariantId: 'v0', sku: 'SKU1' }),
};

describe('GetProductStoreAvailabilityUseCase', () => {
  let useCase: GetProductStoreAvailabilityUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetProductStoreAvailabilityUseCase(mockProductRepository as never);
  });

  it('should return availability (happy path)', async () => {
    const result = await useCase.execute({ productId: 'p1' });

    expect(result.productId).toBe('p1');
    expect(result.sku).toBe('SKU1');
    expect(result.totalQuantity).toBe(0);
    expect(result.stores).toEqual([]);
  });

  it('should throw ProductNotFoundError when product not found', async () => {
    mockProductRepository.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute({ productId: 'nonexistent' }))
      .rejects.toThrow(ProductNotFoundError);
  });

  it('should use specific variant when provided', async () => {
    const result = await useCase.execute({ productId: 'p1', variantId: 'v1' });

    expect(result.sku).toBe('VAR-SKU1');
    expect(mockProductRepository.findVariantById).toHaveBeenCalledWith('v1');
  });
});
