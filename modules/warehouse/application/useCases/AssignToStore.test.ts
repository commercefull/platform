import '../../tests/testUtils';
import { AssignToStoreUseCase } from './AssignToStore';
import { WarehouseNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import { createAssignRepositories, emitMock } from '../../tests/testUtils';

describe('AssignToStoreUseCase', () => {
  const { warehouseRepository, storeRepository } = createAssignRepositories();
  const useCase = new AssignToStoreUseCase(warehouseRepository, storeRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    warehouseRepository.findById.mockResolvedValue({ warehouseId: 'wh-1', name: 'Main' });
    warehouseRepository.unsetDefaultForStore.mockResolvedValue(undefined);
    warehouseRepository.assignToStore.mockResolvedValue({
      warehouseId: 'wh-1',
      storeId: 's1',
      priority: 0,
      isDefault: true,
    });
    storeRepository.findById.mockResolvedValue({ storeId: 's1' });
  });

  it('should assign the warehouse to the store and emit warehouse.assigned_to_store', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1', storeId: 's1', isDefault: true });

    expect(result.warehouseId).toBe('wh-1');
    expect(result.storeId).toBe('s1');
    expect(result.isDefault).toBe(true);
    expect(warehouseRepository.unsetDefaultForStore).toHaveBeenCalledWith('s1');
    expect(emitMock).toHaveBeenCalledWith(
      'warehouse.assigned_to_store',
      expect.objectContaining({ warehouseId: 'wh-1' }),
    );
  });

  it('should throw WarehouseNotFoundError when the warehouse does not exist', async () => {
    warehouseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing', storeId: 's1' })).rejects.toThrow(WarehouseNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw WarehouseValidationError when the store does not exist', async () => {
    storeRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'wh-1', storeId: 'missing' })).rejects.toThrow(WarehouseValidationError);
    expect(warehouseRepository.assignToStore).not.toHaveBeenCalled();
  });

  it('should not unset the existing default when the assignment is not default', async () => {
    await useCase.execute({ warehouseId: 'wh-1', storeId: 's1', isDefault: false });

    expect(warehouseRepository.unsetDefaultForStore).not.toHaveBeenCalled();
  });
});
