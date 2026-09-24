import { emitMock, createStoreRepository, createStore } from '../../tests/testUtils';
import { UpdateStoreUseCase, UpdateStoreCommand } from './UpdateStore';
import { StoreNotFoundError, StoreSlugAlreadyExistsError, StoreValidationError } from '../../domain/errors/StoreErrors';

describe('UpdateStoreUseCase', () => {
  let useCase: UpdateStoreUseCase;
  let storeRepository: ReturnType<typeof createStoreRepository>;

  beforeEach(() => {
    storeRepository = createStoreRepository();
    storeRepository.findById.mockResolvedValue(createStore());
    storeRepository.findBySlug.mockResolvedValue(null);
    storeRepository.findByUrl.mockResolvedValue(null);
    storeRepository.save.mockImplementation(async store => store);
    useCase = new UpdateStoreUseCase(storeRepository);
  });

  it('should update the store and emit store.updated when the store exists', async () => {
    const result = await useCase.execute(new UpdateStoreCommand('store-1', { name: 'Renamed' }));

    expect(result.name).toBe('Renamed');
    expect(storeRepository.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Renamed' }));
    expect(emitMock).toHaveBeenCalledWith('store.updated', expect.objectContaining({ storeId: 'store-1' }));
  });

  it('should throw StoreNotFoundError when the store does not exist', async () => {
    storeRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateStoreCommand('missing', { name: 'X' }))).rejects.toThrow(StoreNotFoundError);
    expect(storeRepository.save).not.toHaveBeenCalled();
  });

  it('should throw StoreSlugAlreadyExistsError when the new slug is taken', async () => {
    storeRepository.findBySlug.mockResolvedValue(createStore({ storeId: 'other-store', slug: 'taken' }));

    await expect(useCase.execute(new UpdateStoreCommand('store-1', { slug: 'taken' }))).rejects.toThrow(
      StoreSlugAlreadyExistsError,
    );
    expect(storeRepository.save).not.toHaveBeenCalled();
  });

  it('should allow keeping the same slug when the store owns it', async () => {
    storeRepository.findBySlug.mockResolvedValue(createStore({ storeId: 'store-1', slug: 'test-store' }));

    const result = await useCase.execute(new UpdateStoreCommand('store-1', { slug: 'test-store' }));

    expect(result.slug).toBe('test-store');
    expect(storeRepository.save).toHaveBeenCalled();
  });

  it('should throw StoreValidationError when the new URL is taken', async () => {
    storeRepository.findByUrl.mockResolvedValue(createStore({ storeId: 'other-store' }));

    await expect(useCase.execute(new UpdateStoreCommand('store-1', { storeUrl: 'taken.example.com' }))).rejects.toThrow(
      StoreValidationError,
    );
  });

  it('should activate the store when isActive is true', async () => {
    storeRepository.findById.mockResolvedValue(createStore({ isActive: false }));

    const result = await useCase.execute(new UpdateStoreCommand('store-1', { isActive: true }));

    expect(result.isActive).toBe(true);
  });

  it('should deactivate the store when isActive is false', async () => {
    const result = await useCase.execute(new UpdateStoreCommand('store-1', { isActive: false }));

    expect(result.isActive).toBe(false);
  });
});
