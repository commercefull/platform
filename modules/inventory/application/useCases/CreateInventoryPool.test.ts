jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('pool-uuid'),
}));

import { CreateInventoryPoolUseCase} from './CreateInventoryPool';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';

describe('CreateInventoryPoolUseCase', () => {
  let useCase: CreateInventoryPoolUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      createPool: jest.fn().mockResolvedValue({
        poolId: 'pool-uuid', name: 'Main Pool', poolType: 'shared',
        linkedInventoryIds: ['inv1', 'inv2'], allocationStrategy: 'fifo', createdAt: new Date(),
      }),
    };
    useCase = new CreateInventoryPoolUseCase(mockRepo as never);
  });

  it('should create inventory pool (happy path)', async () => {
    const result = await useCase.execute({
      ownerType: 'organization', ownerId: 'org1', name: 'Main Pool', poolType: 'shared',
    });

    expect(result.poolId).toBe('pool-uuid');
    expect(result.linkedInventoryCount).toBe(2);
    expect(result.allocationStrategy).toBe('fifo');
  });

  it('should throw InventoryValidationError when ownerId is empty', async () => {
    await expect(useCase.execute({ ownerType: 'organization', ownerId: '', name: 'Pool', poolType: 'shared' })).rejects.toThrow(InventoryValidationError);
  });

  it('should throw InventoryValidationError when name is empty', async () => {
    await expect(useCase.execute({ ownerType: 'organization', ownerId: 'org1', name: '', poolType: 'shared' })).rejects.toThrow(InventoryValidationError);
  });
});
