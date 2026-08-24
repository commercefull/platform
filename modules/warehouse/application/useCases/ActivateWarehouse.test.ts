jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ActivateWarehouseUseCase } from './ActivateWarehouse';
import { WarehouseNotFoundError } from '../../domain/errors/WarehouseErrors';
import { eventBus } from '../../../../libs/events/eventBus';

describe('ActivateWarehouseUseCase', () => {
  let useCase: ActivateWarehouseUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: false }),
      update: jest.fn().mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: true }),
    };
    useCase = new ActivateWarehouseUseCase(mockRepo as never);
    jest.mocked(eventBus.emit).mockClear();
  });

  it('should activate a warehouse successfully', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.isActive).toBe(true);
    expect(eventBus.emit).toHaveBeenCalledWith('warehouse.activated', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should return without updating if already active', async () => {
    mockRepo.findById.mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: true });

    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.isActive).toBe(true);
    expect(mockRepo.update).not.toHaveBeenCalled();
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  it('should throw WarehouseNotFoundError when warehouse does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing' })).rejects.toThrow(WarehouseNotFoundError);
  });
});
