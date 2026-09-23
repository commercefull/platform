import '../../tests/testUtils';
import { GetWarehouseUseCase } from './GetWarehouse';
import { WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import { createGetRepository, createWarehouseRecord } from '../../tests/testUtils';

function warehouseRecord(overrides: Record<string, unknown> = {}) {
  return createWarehouseRecord({
    name: 'Main',
    code: 'WH001',
    city: 'Portland',
    state: 'OR',
    postalCode: '97201',
    timezone: 'America/Los_Angeles',
    isDefault: true,
    ...overrides,
  });
}

describe('GetWarehouseUseCase', () => {
  const warehouseRepository = createGetRepository();
  const useCase = new GetWarehouseUseCase(warehouseRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    warehouseRepository.findById.mockResolvedValue(null);
    warehouseRepository.findByCode.mockResolvedValue(null);
  });

  it('should return the warehouse when found by id', async () => {
    warehouseRepository.findById.mockResolvedValue(warehouseRecord());

    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.warehouse).not.toBeNull();
    expect(result.warehouse!.warehouseId).toBe('wh-1');
    expect(result.warehouse!.name).toBe('Main');
  });

  it('should return the warehouse when found by code', async () => {
    warehouseRepository.findByCode.mockResolvedValue(warehouseRecord({ distributionWarehouseId: 'wh-2', code: 'EAST' }));

    const result = await useCase.execute({ code: 'EAST' });

    expect(result.warehouse).not.toBeNull();
    expect(result.warehouse!.code).toBe('EAST');
  });

  it('should return null when the warehouse is not found', async () => {
    const result = await useCase.execute({ warehouseId: 'missing' });

    expect(result.warehouse).toBeNull();
  });

  it('should throw WarehouseValidationError when neither id nor code is provided', async () => {
    await expect(useCase.execute({})).rejects.toThrow(WarehouseValidationError);
    expect(warehouseRepository.findById).not.toHaveBeenCalled();
    expect(warehouseRepository.findByCode).not.toHaveBeenCalled();
  });
});
