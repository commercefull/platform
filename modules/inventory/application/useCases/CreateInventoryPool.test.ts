import { lazyMock, uuidMock } from '../../tests/testUtils';
import { CreateInventoryPoolUseCase } from './CreateInventoryPool';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';

describe('CreateInventoryPoolUseCase', () => {
  let useCase: CreateInventoryPoolUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof CreateInventoryPoolUseCase>[0]>;

  beforeEach(() => {
    uuidMock.mockReturnValue('pool-uuid');
    mockRepo = lazyMock<ConstructorParameters<typeof CreateInventoryPoolUseCase>[0]>();
    mockRepo.createPool.mockImplementation(async (params) => ({
      ...params,
      linkedInventoryIds: ['inv1', 'inv2'],
      createdAt: new Date(),
    }));
    useCase = new CreateInventoryPoolUseCase(mockRepo);
  });

  it('should create inventory pool (happy path)', async () => {
    const result = await useCase.execute({
      ownerType: 'organization',
      ownerId: 'org1',
      name: 'Main Pool',
      poolType: 'shared',
    });

    expect(result.poolId).toBe('pool-uuid');
    expect(result.linkedInventoryCount).toBe(2);
    expect(result.allocationStrategy).toBe('fifo');
  });

  it('should throw InventoryValidationError when ownerId is empty', async () => {
    await expect(useCase.execute({ ownerType: 'organization', ownerId: '', name: 'Pool', poolType: 'shared' })).rejects.toThrow(
      InventoryValidationError,
    );
  });

  it('should throw InventoryValidationError when name is empty', async () => {
    await expect(useCase.execute({ ownerType: 'organization', ownerId: 'org1', name: '', poolType: 'shared' })).rejects.toThrow(
      InventoryValidationError,
    );
  });
});
