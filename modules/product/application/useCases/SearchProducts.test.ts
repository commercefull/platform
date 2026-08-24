import { SearchProductsUseCase, SearchProductsCommand } from './SearchProducts';

describe('SearchProductsUseCase', () => {
  let useCase: SearchProductsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeProduct = (id: string) => ({
    productId: id, name: `Product ${id}`, slug: `product-${id}`, sku: `SKU${id}`,
    price: { basePrice: 100, salePrice: null, effectivePrice: 100, isOnSale: false, discountPercentage: 0 },
    isFeatured: false, primaryImage: null, categoryId: 'cat1', shortDescription: 'A product',
  });

  beforeEach(() => {
    mockRepo = {
      search: jest.fn().mockResolvedValue({
        data: [makeProduct('p1'), makeProduct('p2')], total: 2, limit: 20, offset: 0, hasMore: false,
      }),
    };
    useCase = new SearchProductsUseCase(mockRepo as never);
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
