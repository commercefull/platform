jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { AssignToStoreUseCase} from './AssignToStore';
import { WarehouseNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('AssignToStoreUseCase', () => {
  let useCase: AssignToStoreUseCase;
  let mockWhRepo: Record<string, jest.Mock>;
  let mockStoreRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockWhRepo = {
      findById: jest.fn().mockResolvedValue({ warehouseId: 'wh-1', name: 'Main' }),
      unsetDefaultForStore: jest.fn().mockResolvedValue(undefined),
      assignToStore: jest.fn().mockResolvedValue({ warehouseId: 'wh-1', storeId: 's1', priority: 0, isDefault: true }),
    };
    mockStoreRepo = { findById: jest.fn().mockResolvedValue({ storeId: 's1' }) };
    useCase = new AssignToStoreUseCase(mockWhRepo as never, mockStoreRepo as never);
  });

  it('should assign warehouse to store (happy path)', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1', storeId: 's1', isDefault: true });

    expect(result.warehouseId).toBe('wh-1');
    expect(result.storeId).toBe('s1');
    expect(result.isDefault).toBe(true);
    expect(mockWhRepo.unsetDefaultForStore).toHaveBeenCalledWith('s1');
    expect(eventBus.emit).toHaveBeenCalledWith('warehouse.assigned_to_store', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should throw WarehouseNotFoundError when warehouse does not exist', async () => {
    mockWhRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing', storeId: 's1' })).rejects.toThrow(WarehouseNotFoundError);
  });

  it('should throw WarehouseValidationError when store does not exist', async () => {
    mockStoreRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'wh-1', storeId: 'missing' })).rejects.toThrow(WarehouseValidationError);
  });

  it('should not unset default when isDefault is false', async () => {
    await useCase.execute({ warehouseId: 'wh-1', storeId: 's1', isDefault: false });

    expect(mockWhRepo.unsetDefaultForStore).not.toHaveBeenCalled();
  });
});
