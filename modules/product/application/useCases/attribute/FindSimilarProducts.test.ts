import { FindSimilarProductsUseCase } from './FindSimilarProducts';
import type { ProductSearchServicePort } from './SearchProducts';
import { createProduct, lazyMock } from '../../../tests/testUtils';

describe('FindSimilarProductsUseCase', () => {
  let useCase: FindSimilarProductsUseCase;
  let mockService: jest.Mocked<ProductSearchServicePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = lazyMock<ProductSearchServicePort>();
    useCase = new FindSimilarProductsUseCase(mockService);
  });

  it('should return similar products with the default limit', async () => {
    mockService.findSimilar.mockResolvedValue([createProduct()]);

    const result = await useCase.execute({ productId: 'p1' });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mockService.findSimilar).toHaveBeenCalledWith('p1', 10);
  });

  it('should forward an explicit limit', async () => {
    mockService.findSimilar.mockResolvedValue([]);

    await useCase.execute({ productId: 'p1', limit: 5 });

    expect(mockService.findSimilar).toHaveBeenCalledWith('p1', 5);
  });

  it('should return failure when the search service throws', async () => {
    mockService.findSimilar.mockRejectedValue(new Error('lookup failed'));

    const result = await useCase.execute({ productId: 'p1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('lookup failed');
  });
});
