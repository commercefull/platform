import { SearchProductsUseCase, SearchProductsCommand } from './SearchProducts';
import { createProduct, lazyMock } from '../../tests/testUtils';

describe('SearchProductsUseCase', () => {
  let useCase: SearchProductsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof SearchProductsUseCase>[0]>;

  const makeProduct = (id: string) => createProduct({ productId: id, name: `Product ${id}`, sku: `SKU${id}` });

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof SearchProductsUseCase>[0]>();
    mockRepo.search.mockResolvedValue({
      data: [makeProduct('p1'), makeProduct('p2')],
      total: 2,
      limit: 20,
      offset: 0,
      hasMore: false,
      length: 2,
    });
    useCase = new SearchProductsUseCase(mockRepo);
  });

  it('should search products (happy path)', async () => {
    const result = await useCase.execute(new SearchProductsCommand('widget'));

    expect(result.products).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.query).toBe('widget');
  });

  it('should return empty results for empty query', async () => {
    const result = await useCase.execute(new SearchProductsCommand(''));

    expect(result.products).toHaveLength(0);
    expect(mockRepo.search).not.toHaveBeenCalled();
  });

  it('should pass filters and pagination to repository', async () => {
    await useCase.execute(new SearchProductsCommand('widget', { priceMin: 10, priceMax: 50 }, 10, 5, 'price_asc'));

    expect(mockRepo.search).toHaveBeenCalledWith(
      'widget',
      expect.objectContaining({ priceMin: 10, priceMax: 50 }),
      expect.objectContaining({ limit: 10, offset: 5, orderBy: 'basePrice', orderDirection: 'asc' }),
    );
  });
});
