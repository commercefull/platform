import { ListStoresUseCase, ListStoresQuery } from './ListStores';

describe('ListStoresUseCase', () => {
  let useCase: ListStoresUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeStores = () => [
    { storeId: 's1', name: 'Store 1', slug: 'store-1', storeType: 'merchant_store', isHeadquarters: true, isActive: true, isVerified: true, isFeatured: false, createdAt: new Date() },
    { storeId: 's2', name: 'Store 2', slug: 'store-2', storeType: 'organization_store', isHeadquarters: false, isActive: false, isVerified: false, isFeatured: true, createdAt: new Date() },
  ];

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue(makeStores()),
      count: jest.fn().mockResolvedValue(2),
    };
    useCase = new ListStoresUseCase(mockRepo as never);
  });

  it('should list stores with default pagination', async () => {
    const result = await useCase.execute(new ListStoresQuery());

    expect(result.stores).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should paginate correctly', async () => {
    const result = await useCase.execute(new ListStoresQuery({}, { page: 2, limit: 1 }));

    expect(result.stores).toHaveLength(1);
    expect(result.stores[0].storeId).toBe('s2');
    expect(result.totalPages).toBe(2);
  });

  it('should pass filters to repository', async () => {
    await useCase.execute(new ListStoresQuery({ isActive: true, storeType: 'merchant_store' }));

    expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ isActive: true, storeType: 'merchant_store' }));
  });
});
