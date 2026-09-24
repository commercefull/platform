import '../../tests/testUtils';
import { DeactivateWarehouseUseCase } from './DeactivateWarehouse';
import { WarehouseNotFoundError } from '../../domain/errors/WarehouseErrors';
import { createDeactivateRepository, emitMock } from '../../tests/testUtils';

describe('DeactivateWarehouseUseCase', () => {
  const warehouseRepository = createDeactivateRepository();
  const useCase = new DeactivateWarehouseUseCase(warehouseRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    warehouseRepository.findById.mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: true });
    warehouseRepository.update.mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: false });
  });

  it('should deactivate the warehouse and emit warehouse.deactivated', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.isActive).toBe(false);
    expect(emitMock).toHaveBeenCalledWith('warehouse.deactivated', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should return the warehouse without updating when it is already inactive', async () => {
    warehouseRepository.findById.mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: false });

    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.isActive).toBe(false);
    expect(warehouseRepository.update).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw WarehouseNotFoundError when the warehouse does not exist', async () => {
    warehouseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing' })).rejects.toThrow(WarehouseNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
