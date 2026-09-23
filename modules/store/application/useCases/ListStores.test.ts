import { createStoreRepository, createStore } from '../../tests/testUtils';
import { ListStoresUseCase, ListStoresQuery } from './ListStores';

describe('ListStoresUseCase', () => {
  let useCase: ListStoresUseCase;
  let storeRepository: ReturnType<typeof createStoreRepository>;

  beforeEach(() => {
    storeRepository = createStoreRepository();
    storeRepository.findAll.mockResolvedValue([
      createStore({ storeId: 's1', name: 'One' }),
      createStore({ storeId: 's2', name: 'Two' }),
      createStore({ storeId: 's3', name: 'Three' }),
    ]);
    storeRepository.count.mockResolvedValue(3);
    useCase = new ListStoresUseCase(storeRepository);
  });

  it('should list stores with default pagination when no pagination is given', async () => {
    const result = await useCase.execute(new ListStoresQuery());

    expect(result.stores).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should paginate the results when page and limit are given', async () => {
    const result = await useCase.execute(new ListStoresQuery(undefined, { page: 2, limit: 2 }));

    expect(result.stores).toHaveLength(1); // third store
    expect(result.stores[0].storeId).toBe('s3');
    expect(result.totalPages).toBe(2);
  });

  it('should pass the filters to the repository', async () => {
    await useCase.execute(new ListStoresQuery({ storeType: 'organization_store', isActive: true }));

    expect(storeRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ storeType: 'organization_store', isActive: true }),
    );
    expect(storeRepository.count).toHaveBeenCalledWith(
      expect.objectContaining({ storeType: 'organization_store', isActive: true }),
    );
  });
});
