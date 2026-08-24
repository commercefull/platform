jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { DeactivateWarehouseUseCase } from './DeactivateWarehouse';
import { WarehouseNotFoundError } from '../../domain/errors/WarehouseErrors';
import { eventBus } from '../../../../libs/events/eventBus';

describe('DeactivateWarehouseUseCase', () => {
  let useCase: DeactivateWarehouseUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: true }),
      update: jest.fn().mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: false }),
    };
    useCase = new DeactivateWarehouseUseCase(mockRepo as never);
    jest.mocked(eventBus.emit).mockClear();
  });

  it('should deactivate a warehouse successfully', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.isActive).toBe(false);
    expect(eventBus.emit).toHaveBeenCalledWith('warehouse.deactivated', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should return without updating if already inactive', async () => {
    mockRepo.findById.mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: false });

    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.isActive).toBe(false);
    expect(mockRepo.update).not.toHaveBeenCalled();
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  it('should throw WarehouseNotFoundError when warehouse does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing' })).rejects.toThrow(WarehouseNotFoundError);
  });
});
