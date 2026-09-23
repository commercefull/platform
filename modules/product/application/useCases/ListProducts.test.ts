import { ListProductsUseCase, ListProductsCommand } from './ListProducts';
import { createProduct, lazyMock } from '../../tests/testUtils';

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ListProductsUseCase>[0]>;

  const makeProduct = (id: string) => createProduct({ productId: id, name: `Product ${id}`, sku: `SKU-${id}` });

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof ListProductsUseCase>[0]>();
    mockRepo.findAll.mockResolvedValue({
      data: [makeProduct('p1'), makeProduct('p2')],
      total: 2,
      limit: 20,
      offset: 0,
      hasMore: false,
      length: 2,
    });
    useCase = new ListProductsUseCase(mockRepo);
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
