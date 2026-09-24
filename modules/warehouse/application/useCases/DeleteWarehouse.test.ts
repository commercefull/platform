import '../../tests/testUtils';
import { DeleteWarehouseUseCase } from './DeleteWarehouse';
import { WarehouseNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import { createDeleteRepository, emitMock } from '../../tests/testUtils';

describe('DeleteWarehouseUseCase', () => {
  const warehouseRepository = createDeleteRepository();
  const useCase = new DeleteWarehouseUseCase(warehouseRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    warehouseRepository.findById.mockResolvedValue({ warehouseId: 'wh-1', name: 'Main' });
    warehouseRepository.hasInventory.mockResolvedValue(false);
    warehouseRepository.hasAssignedStores.mockResolvedValue(false);
    warehouseRepository.delete.mockResolvedValue(undefined);
  });

  it('should delete the warehouse and emit warehouse.deleted', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.deleted).toBe(true);
    expect(warehouseRepository.delete).toHaveBeenCalledWith('wh-1');
    expect(emitMock).toHaveBeenCalledWith('warehouse.deleted', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should throw WarehouseNotFoundError when the warehouse does not exist', async () => {
    warehouseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing' })).rejects.toThrow(WarehouseNotFoundError);
    expect(warehouseRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw WarehouseValidationError when the warehouse has inventory', async () => {
    warehouseRepository.hasInventory.mockResolvedValue(true);

    await expect(useCase.execute({ warehouseId: 'wh-1' })).rejects.toThrow(WarehouseValidationError);
    expect(warehouseRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw WarehouseValidationError when the warehouse has assigned stores', async () => {
    warehouseRepository.hasAssignedStores.mockResolvedValue(true);

    await expect(useCase.execute({ warehouseId: 'wh-1' })).rejects.toThrow(WarehouseValidationError);
    expect(warehouseRepository.delete).not.toHaveBeenCalled();
  });

  it('should delete despite inventory and assignments when force is true', async () => {
    warehouseRepository.hasInventory.mockResolvedValue(true);
    warehouseRepository.hasAssignedStores.mockResolvedValue(true);

    const result = await useCase.execute({ warehouseId: 'wh-1', force: true });

    expect(result.deleted).toBe(true);
  });
});
