import { createProduct, createProductVariant, lazyMock, queryMock } from '../../tests/testUtils';
import { GetProductStoreAvailabilityUseCase } from './GetProductStoreAvailability';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';

let mockProductRepository: jest.Mocked<ConstructorParameters<typeof GetProductStoreAvailabilityUseCase>[0]>;

describe('GetProductStoreAvailabilityUseCase', () => {
  let useCase: GetProductStoreAvailabilityUseCase;

  beforeEach(() => {
    queryMock.mockResolvedValue([]);
    mockProductRepository = lazyMock<ConstructorParameters<typeof GetProductStoreAvailabilityUseCase>[0]>();
    mockProductRepository.findById.mockResolvedValue(createProduct());
    mockProductRepository.findVariantById.mockResolvedValue(createProductVariant({ variantId: 'v1', sku: 'VAR-SKU1' }));
    mockProductRepository.getDefaultVariant.mockResolvedValue(createProductVariant({ variantId: 'v0', sku: 'SKU1' }));
    useCase = new GetProductStoreAvailabilityUseCase(mockProductRepository);
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

    await expect(useCase.execute({ productId: 'nonexistent' })).rejects.toThrow(ProductNotFoundError);
  });

  it('should use specific variant when provided', async () => {
    const result = await useCase.execute({ productId: 'p1', variantId: 'v1' });

    expect(result.sku).toBe('VAR-SKU1');
    expect(mockProductRepository.findVariantById).toHaveBeenCalledWith('v1');
  });
});
