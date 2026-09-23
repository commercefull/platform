import { createStoreRepository, createStore } from '../../tests/testUtils';
import { GetStoreUseCase, GetStoreQuery } from './GetStore';
import { StoreValidationError } from '../../domain/errors/StoreErrors';

describe('GetStoreUseCase', () => {
  let useCase: GetStoreUseCase;
  let storeRepository: ReturnType<typeof createStoreRepository>;

  beforeEach(() => {
    storeRepository = createStoreRepository();
    useCase = new GetStoreUseCase(storeRepository);
  });

  it('should return the store when found by id', async () => {
    storeRepository.findById.mockResolvedValue(createStore({ name: 'Downtown' }));

    const result = await useCase.execute(new GetStoreQuery('store-1'));

    expect(result.store?.name).toBe('Downtown');
    expect(storeRepository.findById).toHaveBeenCalledWith('store-1');
  });

  it('should find the store by slug when no id is given', async () => {
    storeRepository.findBySlug.mockResolvedValue(createStore({ slug: 'my-store' }));

    const result = await useCase.execute(new GetStoreQuery(undefined, 'my-store'));

    expect(result.store?.slug).toBe('my-store');
    expect(storeRepository.findBySlug).toHaveBeenCalledWith('my-store');
    expect(storeRepository.findById).not.toHaveBeenCalled();
  });

  it('should find the store by URL when only storeUrl is given', async () => {
    storeRepository.findByUrl.mockResolvedValue(createStore());

    const result = await useCase.execute(new GetStoreQuery(undefined, undefined, 'shop.example.com'));

    expect(result.store).not.toBeNull();
    expect(storeRepository.findByUrl).toHaveBeenCalledWith('shop.example.com');
  });

  it('should return null when the store is not found', async () => {
    storeRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute(new GetStoreQuery('missing'));

    expect(result.store).toBeNull();
  });

  it('should throw StoreValidationError when no identifier is provided', async () => {
    await expect(useCase.execute(new GetStoreQuery())).rejects.toThrow(StoreValidationError);
    expect(storeRepository.findById).not.toHaveBeenCalled();
  });

  it('should map the entity fields to the response shape', async () => {
    storeRepository.findById.mockResolvedValue(
      createStore({ storeId: 'store-7', name: 'Flagship', slug: 'flagship', isVerified: true }),
    );

    const result = await useCase.execute(new GetStoreQuery('store-7'));

    expect(result.store).toEqual(
      expect.objectContaining({
        storeId: 'store-7',
        name: 'Flagship',
        slug: 'flagship',
        storeType: 'organization_store',
        isVerified: true,
        isActive: true,
      }),
    );
  });
});
