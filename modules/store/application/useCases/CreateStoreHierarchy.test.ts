import { CreateStoreHierarchyUseCase } from './CreateStoreHierarchy';
import { StoreNotFoundError, StoreValidationError } from '../../domain/errors/StoreErrors';

const mockStoreRepository = {
  findById: jest.fn().mockResolvedValue({ storeId: 's1', name: 'Store 1' }),
  createHierarchy: jest.fn().mockResolvedValue({
    hierarchyId: 'hier_1', organizationId: 'org1', name: 'My Hierarchy',
    defaultStoreId: 's1', createdAt: new Date('2026-01-01'),
  }),
};

describe('CreateStoreHierarchyUseCase', () => {
  let useCase: CreateStoreHierarchyUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateStoreHierarchyUseCase(mockStoreRepository as never);
  });

  it('should create hierarchy (happy path)', async () => {
    const result = await useCase.execute({
      organizationId: 'org1', name: 'My Hierarchy',
      defaultStoreId: 's1', storeIds: ['s1'],
    });

    expect(result.hierarchyId).toBe('hier_1');
    expect(result.storeCount).toBe(1);
  });

  it('should throw StoreValidationError when required fields missing', async () => {
    await expect(useCase.execute({
      organizationId: '', name: 'Test', defaultStoreId: 's1', storeIds: ['s1'],
    })).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreValidationError when default store not in storeIds', async () => {
    await expect(useCase.execute({
      organizationId: 'org1', name: 'Test', defaultStoreId: 's1', storeIds: ['s2'],
    })).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreNotFoundError when store not found', async () => {
    mockStoreRepository.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute({
      organizationId: 'org1', name: 'Test', defaultStoreId: 's1', storeIds: ['s1'],
    })).rejects.toThrow(StoreNotFoundError);
  });
});
