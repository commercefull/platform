import { AllocateFromPoolUseCase} from './AllocateFromPool';
import { InventoryLocationNotFoundError, InventoryValidationError } from '../../domain/errors/InventoryErrors';

describe('AllocateFromPoolUseCase', () => {
  let useCase: AllocateFromPoolUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findPoolById: jest.fn().mockResolvedValue({ poolId: 'p1', isActive: true, allocationStrategy: 'fifo' }),
      findAvailableInPool: jest.fn().mockResolvedValue([
        { inventoryId: 'inv1', locationId: 'loc1', availableQuantity: 50, priority: 1, createdAt: new Date() },
      ]),
      reserveStock: jest.fn().mockResolvedValue(undefined),
      createAllocation: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new AllocateFromPoolUseCase(mockRepo as never);
  });

  it('should allocate from pool (happy path)', async () => {
    const result = await useCase.execute({
      poolId: 'p1', orderId: 'o1', items: [{ productId: 'prod1', quantity: 10 }],
    });

    expect(result.fullyAllocated).toBe(true);
    expect(result.results[0].allocations).toHaveLength(1);
    expect(result.results[0].shortfall).toBe(0);
    expect(mockRepo.reserveStock).toHaveBeenCalled();
    expect(mockRepo.createAllocation).toHaveBeenCalled();
  });

  it('should throw InventoryLocationNotFoundError when pool not found', async () => {
    mockRepo.findPoolById.mockResolvedValue(null);

    await expect(useCase.execute({ poolId: 'missing', orderId: 'o1', items: [] })).rejects.toThrow(InventoryLocationNotFoundError);
  });

  it('should throw InventoryValidationError when pool is inactive', async () => {
    mockRepo.findPoolById.mockResolvedValue({ poolId: 'p1', isActive: false, allocationStrategy: 'fifo' });

    await expect(useCase.execute({ poolId: 'p1', orderId: 'o1', items: [] })).rejects.toThrow(InventoryValidationError);
  });

  it('should report shortfall when insufficient stock', async () => {
    mockRepo.findAvailableInPool.mockResolvedValue([
      { inventoryId: 'inv1', locationId: 'loc1', availableQuantity: 5, priority: 1, createdAt: new Date() },
    ]);

    const result = await useCase.execute({
      poolId: 'p1', orderId: 'o1', items: [{ productId: 'prod1', quantity: 10 }],
    });

    expect(result.fullyAllocated).toBe(false);
    expect(result.results[0].shortfall).toBe(5);
  });
});
