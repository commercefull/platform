import { createStoreRepository, createStore } from '../../tests/testUtils';
import { CreateStoreHierarchyUseCase } from './CreateStoreHierarchy';
import { StoreNotFoundError, StoreValidationError } from '../../domain/errors/StoreErrors';

describe('CreateStoreHierarchyUseCase', () => {
  let useCase: CreateStoreHierarchyUseCase;
  let storeRepository: ReturnType<typeof createStoreRepository>;

  const validInput = {
    organizationId: 'org-1',
    name: 'US Retail Group',
    defaultStoreId: 'store-1',
    storeIds: ['store-1', 'store-2'],
  };

  beforeEach(() => {
    storeRepository = createStoreRepository();
    storeRepository.findById.mockImplementation(async id => createStore({ storeId: id }));
    storeRepository.createHierarchy.mockImplementation(async input => ({
      ...input,
      createdAt: new Date(),
    }));
    useCase = new CreateStoreHierarchyUseCase(storeRepository);
  });

  it('should create the hierarchy when all stores exist', async () => {
    const result = await useCase.execute(validInput);

    expect(result.hierarchyId).toBe('test-uuid');
    expect(result.storeCount).toBe(2);
    expect(storeRepository.createHierarchy).toHaveBeenCalledWith(
      expect.objectContaining({
        hierarchyId: 'test-uuid',
        organizationId: 'org-1',
        defaultStoreId: 'store-1',
        storeIds: ['store-1', 'store-2'],
      }),
    );
  });

  it('should throw StoreValidationError when required fields are missing', async () => {
    await expect(useCase.execute({ ...validInput, organizationId: '' })).rejects.toThrow(StoreValidationError);
    await expect(useCase.execute({ ...validInput, name: '' })).rejects.toThrow(StoreValidationError);
    await expect(useCase.execute({ ...validInput, defaultStoreId: '' })).rejects.toThrow(StoreValidationError);
    expect(storeRepository.createHierarchy).not.toHaveBeenCalled();
  });

  it('should throw StoreValidationError when the default store is not in storeIds', async () => {
    await expect(useCase.execute({ ...validInput, defaultStoreId: 'store-9' })).rejects.toThrow(StoreValidationError);
    expect(storeRepository.createHierarchy).not.toHaveBeenCalled();
  });

  it('should throw StoreNotFoundError when a member store does not exist', async () => {
    storeRepository.findById.mockImplementation(async id => (id === 'store-2' ? null : createStore({ storeId: id })));

    await expect(useCase.execute(validInput)).rejects.toThrow(StoreNotFoundError);
    expect(storeRepository.createHierarchy).not.toHaveBeenCalled();
  });
});
