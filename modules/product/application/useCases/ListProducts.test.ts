import { ListProductsUseCase, ListProductsCommand } from './ListProducts';

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeProduct = (id: string) => ({
    productId: id, name: `Product ${id}`, slug: `product-${id}`, sku: `SKU-${id}`,
    status: 'active', visibility: 'public', isFeatured: false, hasVariants: false,
    price: { basePrice: 10, salePrice: null, effectivePrice: 10, isOnSale: false, cost: 5 },
    primaryImage: null, categoryId: 'cat-1', createdAt: new Date(),
  });

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue({
        data: [makeProduct('p1'), makeProduct('p2')], total: 2, limit: 20, offset: 0, hasMore: false,
      }),
    };
    useCase = new ListProductsUseCase(mockRepo as never);
  });

  it('should list products (happy path)', async () => {
    const result = await useCase.execute(new ListProductsCommand());

    expect(result.products).toHaveLength(2);
    expect(result.products[0].productId).toBe('p1');
    expect(result.total).toBe(2);
  });

  it('should pass filters and pagination to repository', async () => {
    await useCase.execute(new ListProductsCommand({ isFeatured: true }, 10, 5, 'name', 'asc'));

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ isFeatured: true }),
      expect.objectContaining({ limit: 10, offset: 5, orderBy: 'name', orderDirection: 'asc' }),
    );
  });
});
