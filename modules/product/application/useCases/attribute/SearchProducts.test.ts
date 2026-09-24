
import { SearchProductsUseCase } from './SearchProducts';
import type { ProductSearchServicePort } from './SearchProducts';
import { createProductSearchRow, lazyMock } from '../../../tests/testUtils';

describe('SearchProductsUseCase', () => {
  let useCase: SearchProductsUseCase;
  let mockService: jest.Mocked<ProductSearchServicePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = lazyMock<ProductSearchServicePort>();
    mockService.search.mockResolvedValue({
      products: [createProductSearchRow({ productId: 'p1', name: 'Widget', priceCents: 4500, effectivePriceCents: 4500 })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      facets: { categories: [], brands: [], priceRanges: [], attributes: [] },
    });
    useCase = new SearchProductsUseCase(mockService);
  });

  it('should search products (happy path)', async () => {
    const result = await useCase.execute({ query: 'widget' });

    expect(result.success).toBe(true);
    expect(result.data?.products).toHaveLength(1);
    expect(result.data?.total).toBe(1);
  });

  it('should use default filters when none provided', async () => {
    const result = await useCase.execute({});

    expect(result.success).toBe(true);
    expect(mockService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        visibility: 'visible',
        page: 1,
        limit: 20,
      }),
    );
  });

  it('should forward explicit filters, attributes, sorting and pagination to the search service', async () => {
    const attributes = [{ code: 'color', value: 'red' }];

    await useCase.execute({
      query: 'shoe',
      categoryIds: ['c1', 'c2'],
      productTypeId: 'pt1',
      minPriceCents: 1000,
      maxPriceCents: 5000,
      status: 'draft',
      visibility: 'hidden',
      isFeatured: true,
      inStock: true,
      attributes,
      sortBy: 'price',
      sortOrder: 'desc',
      page: 3,
      limit: 50,
    });

    expect(mockService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'shoe',
        categoryIds: ['c1', 'c2'],
        productTypeId: 'pt1',
        minPriceCents: 1000,
        maxPriceCents: 5000,
        status: 'draft',
        visibility: 'hidden',
        isFeatured: true,
        inStock: true,
        attributes,
        sortBy: 'price',
        sortOrder: 'desc',
        page: 3,
        limit: 50,
      }),
    );
  });

  it('should return error on failure', async () => {
    mockService.search.mockRejectedValueOnce(new Error('Search failed'));

    const result = await useCase.execute({ query: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
