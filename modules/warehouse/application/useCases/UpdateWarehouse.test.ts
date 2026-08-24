jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { UpdateWarehouseUseCase } from './UpdateWarehouse';
import { WarehouseNotFoundError } from '../../domain/errors/WarehouseErrors';
import { eventBus } from '../../../../libs/events/eventBus';

describe('UpdateWarehouseUseCase', () => {
  let useCase: UpdateWarehouseUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ warehouseId: 'wh-1', name: 'Old', code: 'WH01', isActive: true }),
      update: jest.fn().mockResolvedValue({ warehouseId: 'wh-1', name: 'New Name', code: 'WH01', isActive: true, updatedAt: new Date() }),
    };
    useCase = new UpdateWarehouseUseCase(mockRepo as never);
    jest.mocked(eventBus.emit).mockClear();
  });

  it('should update warehouse successfully (happy path)', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1', name: 'New Name' });

    expect(result.name).toBe('New Name');
    expect(eventBus.emit).toHaveBeenCalledWith('warehouse.updated', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should throw WarehouseNotFoundError when warehouse does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing', name: 'New' })).rejects.toThrow(WarehouseNotFoundError);
  });

  it('should only pass provided fields to update', async () => {
    await useCase.execute({ warehouseId: 'wh-1', name: 'New Name' });

    expect(mockRepo.update).toHaveBeenCalledWith('wh-1', { name: 'New Name' });
  });

  it('should pass all provided fields to update', async () => {
    await useCase.execute({ warehouseId: 'wh-1', name: 'New', code: 'WH02', capacity: 5000, priorityScore: 10 });

    expect(mockRepo.update).toHaveBeenCalledWith('wh-1', expect.objectContaining({ name: 'New', code: 'WH02', capacity: 5000, priorityScore: 10 }));
  });
});
