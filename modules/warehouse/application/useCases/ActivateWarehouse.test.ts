import '../../tests/testUtils';
import { ActivateWarehouseUseCase } from './ActivateWarehouse';
import { WarehouseNotFoundError } from '../../domain/errors/WarehouseErrors';
import { createActivateRepository, emitMock } from '../../tests/testUtils';

describe('ActivateWarehouseUseCase', () => {
  const warehouseRepository = createActivateRepository();
  const useCase = new ActivateWarehouseUseCase(warehouseRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    warehouseRepository.findById.mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: false });
    warehouseRepository.update.mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: true });
  });

  it('should activate the warehouse and emit warehouse.activated', async () => {
    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.isActive).toBe(true);
    expect(warehouseRepository.update).toHaveBeenCalledWith('wh-1', expect.objectContaining({ isActive: true }));
    expect(emitMock).toHaveBeenCalledWith('warehouse.activated', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should return the warehouse without updating when it is already active', async () => {
    warehouseRepository.findById.mockResolvedValue({ warehouseId: 'wh-1', name: 'WH', isActive: true });

    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.isActive).toBe(true);
    expect(warehouseRepository.update).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw WarehouseNotFoundError when the warehouse does not exist', async () => {
    warehouseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ warehouseId: 'missing' })).rejects.toThrow(WarehouseNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
