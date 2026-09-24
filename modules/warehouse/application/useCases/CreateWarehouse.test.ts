import '../../tests/testUtils';
import { CreateWarehouseUseCase } from './CreateWarehouse';
import { WarehouseCodeAlreadyExistsError } from '../../domain/errors/WarehouseErrors';
import { createCreateRepository, createWarehouseRecord, emitMock } from '../../tests/testUtils';

describe('CreateWarehouseUseCase', () => {
  const warehouseRepository = createCreateRepository();
  const useCase = new CreateWarehouseUseCase(warehouseRepository);

  const input = {
    name: 'Main WH',
    code: 'WH01',
    type: 'warehouse' as const,
    address: { addressLine1: '123 Main St', city: 'Springfield', postalCode: '12345', countryCode: 'US' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    warehouseRepository.findByCode.mockResolvedValue(null);
    warehouseRepository.findDefault.mockResolvedValue(null);
    warehouseRepository.update.mockResolvedValue(null);
    warehouseRepository.create.mockResolvedValue(createWarehouseRecord());
  });

  it('should create the warehouse and emit warehouse.created', async () => {
    const result = await useCase.execute(input);

    expect(result.warehouseId).toBe('wh-1');
    expect(result.name).toBe('Main WH');
    expect(emitMock).toHaveBeenCalledWith('warehouse.created', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should throw WarehouseCodeAlreadyExistsError when the code is taken', async () => {
    warehouseRepository.findByCode.mockResolvedValue(createWarehouseRecord({ distributionWarehouseId: 'existing-wh' }));

    await expect(useCase.execute(input)).rejects.toThrow(WarehouseCodeAlreadyExistsError);
    expect(warehouseRepository.create).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should unset the existing default when creating a new default warehouse', async () => {
    warehouseRepository.findDefault.mockResolvedValue(createWarehouseRecord({ distributionWarehouseId: 'old-default' }));

    await useCase.execute({ ...input, code: 'WH02', isDefault: true });

    expect(warehouseRepository.update).toHaveBeenCalledWith('old-default', { isDefault: false });
  });

  it('should apply default values for timezone and processing time', async () => {
    await useCase.execute({ ...input, code: 'WH03' });

    expect(warehouseRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: expect.any(String), processingTime: expect.anything() }),
    );
  });
});
