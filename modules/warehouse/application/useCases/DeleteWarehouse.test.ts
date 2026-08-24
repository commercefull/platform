jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { DeleteWarehouseUseCase} from './DeleteWarehouse';
import { WarehouseNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('DeleteWarehouseUseCase', () => {
  let useCase: DeleteWarehouseUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ warehouseId: 'wh-1', name: 'Main' }),
      hasInventory: jest.fn().mockResolvedValue(false),
      hasAssignedStores: jest.fn().mockResolvedValue(false),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DeleteWarehouseUseCase(mockRepo as never);
  });

  it('should delete warehouse (happy path)', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.deleted).toBe(true);
    expect(eventBus.emit).toHaveBeenCalledWith('warehouse.deleted', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should throw WarehouseNotFoundError when warehouse does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing' })).rejects.toThrow(WarehouseNotFoundError);
  });

  it('should throw WarehouseValidationError when warehouse has inventory', async () => {
    mockRepo.hasInventory.mockResolvedValue(true);

    await expect(useCase.execute({ warehouseId: 'wh-1' })).rejects.toThrow(WarehouseValidationError);
  });

  it('should throw WarehouseValidationError when warehouse has assigned stores', async () => {
    mockRepo.hasAssignedStores.mockResolvedValue(true);

    await expect(useCase.execute({ warehouseId: 'wh-1' })).rejects.toThrow(WarehouseValidationError);
  });

  it('should force delete when force=true', async () => {
    mockRepo.hasInventory.mockResolvedValue(true);
    mockRepo.hasAssignedStores.mockResolvedValue(true);

    const result = await useCase.execute({ warehouseId: 'wh-1', force: true });

    expect(result.deleted).toBe(true);
  });
});
