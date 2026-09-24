import '../../tests/testUtils';
import { UpdateWarehouseUseCase } from './UpdateWarehouse';
import { WarehouseNotFoundError } from '../../domain/errors/WarehouseErrors';
import { createUpdateRepository, emitMock } from '../../tests/testUtils';

describe('UpdateWarehouseUseCase', () => {
  const warehouseRepository = createUpdateRepository();
  const useCase = new UpdateWarehouseUseCase(warehouseRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    warehouseRepository.findById.mockResolvedValue({
      warehouseId: 'wh-1',
      name: 'Old',
      code: 'WH01',
      isActive: true,
      updatedAt: new Date(),
    });
    warehouseRepository.update.mockResolvedValue({
      warehouseId: 'wh-1',
      name: 'New Name',
      code: 'WH01',
      isActive: true,
      updatedAt: new Date(),
    });
  });

  it('should update the warehouse and emit warehouse.updated', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1', name: 'New Name' });

    expect(result.name).toBe('New Name');
    expect(emitMock).toHaveBeenCalledWith('warehouse.updated', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should throw WarehouseNotFoundError when the warehouse does not exist', async () => {
    warehouseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing', name: 'New' })).rejects.toThrow(WarehouseNotFoundError);
    expect(warehouseRepository.update).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should pass only the provided fields to the repository', async () => {
    await useCase.execute({ warehouseId: 'wh-1', name: 'New Name' });

    expect(warehouseRepository.update).toHaveBeenCalledWith('wh-1', { name: 'New Name' });
  });

  it('should pass all provided fields to the repository', async () => {
    await useCase.execute({ warehouseId: 'wh-1', name: 'New', code: 'WH02', capacity: 5000, priorityScore: 10 });

    expect(warehouseRepository.update).toHaveBeenCalledWith(
      'wh-1',
      expect.objectContaining({ name: 'New', code: 'WH02', capacity: 5000, priorityScore: 10 }),
    );
  });
});
