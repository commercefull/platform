/**
 * Unit Tests for ManageStoresAdmin Use Case
 */

import { createStoreRepository, createStore } from '../../tests/testUtils';
import { ManageStoresAdminUseCase } from './ManageStoresAdmin';

describe('ManageStoresAdminUseCase', () => {
  let useCase: ManageStoresAdminUseCase;
  let storeRepository: ReturnType<typeof createStoreRepository>;

  beforeEach(() => {
    storeRepository = createStoreRepository();
    useCase = new ManageStoresAdminUseCase(storeRepository);
  });

  it('should return the store by id', async () => {
    storeRepository.findById.mockResolvedValue(createStore());

    const result = await useCase.findById('store-1');

    expect(result?.storeId).toBe('store-1');
  });

  it('should return the store by slug', async () => {
    storeRepository.findBySlug.mockResolvedValue(createStore({ slug: 'flagship' }));

    const result = await useCase.findBySlug('flagship');

    expect(result?.slug).toBe('flagship');
  });

  it('should list stores with the given filters', async () => {
    storeRepository.findAll.mockResolvedValue([createStore()]);

    const result = await useCase.findAll({ isActive: true });

    expect(storeRepository.findAll).toHaveBeenCalledWith({ isActive: true });
    expect(result).toHaveLength(1);
  });

  it('should save the store', async () => {
    const store = createStore();
    storeRepository.save.mockResolvedValue(store);

    const result = await useCase.save(store);

    expect(storeRepository.save).toHaveBeenCalledWith(store);
    expect(result).toBe(store);
  });

  it('should delete the store', async () => {
    await useCase.delete('store-1');

    expect(storeRepository.delete).toHaveBeenCalledWith('store-1');
  });

  it('should count stores with the given filters', async () => {
    storeRepository.count.mockResolvedValue(7);

    const result = await useCase.count({ isActive: true });

    expect(result).toBe(7);
  });

  it('should list stores for a business', async () => {
    storeRepository.findByBusiness.mockResolvedValue([createStore()]);

    const result = await useCase.findByBusiness('org-1');

    expect(storeRepository.findByBusiness).toHaveBeenCalledWith('org-1');
    expect(result).toHaveLength(1);
  });

  it('should list active stores', async () => {
    storeRepository.findActive.mockResolvedValue([createStore()]);

    const result = await useCase.findActive();

    expect(result).toHaveLength(1);
  });

  it('should list stores by type', async () => {
    storeRepository.findByType.mockResolvedValue([createStore({ storeType: 'merchant_store' })]);

    const result = await useCase.findByType('merchant_store');

    expect(storeRepository.findByType).toHaveBeenCalledWith('merchant_store');
    expect(result).toHaveLength(1);
  });
});
