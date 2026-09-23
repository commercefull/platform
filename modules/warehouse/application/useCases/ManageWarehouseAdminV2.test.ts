import '../../tests/testUtils';
import { ManageWarehouseAdminUseCaseV2 } from './ManageWarehouseAdminV2';
import { createWarehouseRepository, createWarehouseRecord } from '../../tests/testUtils';
import type { WarehouseCreateParams } from '../../domain/repositories/WarehouseRepository';

describe('ManageWarehouseAdminUseCaseV2', () => {
  const warehouseRepository = createWarehouseRepository();
  const useCase = new ManageWarehouseAdminUseCaseV2(warehouseRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all warehouses with the activeOnly flag forwarded', async () => {
    warehouseRepository.findAll.mockResolvedValue([]);

    const result = await useCase.findAll(true);

    expect(result).toEqual([]);
    expect(warehouseRepository.findAll).toHaveBeenCalledWith(true);
  });

  it('should return warehouse statistics', async () => {
    warehouseRepository.getStatistics.mockResolvedValue({
      total: 5,
      active: 3,
      fulfillmentCenters: 1,
      returnCenters: 1,
      virtual: 0,
    });

    const result = await useCase.getStatistics();

    expect(result.total).toBe(5);
  });

  it('should return a warehouse by id', async () => {
    warehouseRepository.findById.mockResolvedValue(createWarehouseRecord({ distributionWarehouseId: 'w1' }));

    const result = await useCase.findById('w1');

    expect(result?.distributionWarehouseId).toBe('w1');
  });

  it('should delegate creation to the repository', async () => {
    warehouseRepository.create.mockResolvedValue(createWarehouseRecord({ distributionWarehouseId: 'w2' }));
    const params: WarehouseCreateParams = {
      name: 'New WH',
      code: 'WH02',
      isActive: true,
      isDefault: false,
      isFulfillmentCenter: false,
      isReturnCenter: false,
      isVirtual: false,
      addressLine1: '1 St',
      city: 'X',
      state: 'Y',
      postalCode: '1',
      country: 'US',
      timezone: 'UTC',
    };

    const result = await useCase.create(params);

    expect(result.distributionWarehouseId).toBe('w2');
    expect(warehouseRepository.create).toHaveBeenCalledWith(params);
  });

  it('should delegate activation to the repository', async () => {
    warehouseRepository.activate.mockResolvedValue(null);

    await useCase.activate('w1');

    expect(warehouseRepository.activate).toHaveBeenCalledWith('w1');
  });

  it('should delegate deletion to the repository', async () => {
    warehouseRepository.delete.mockResolvedValue(true);

    const result = await useCase.delete('w1');

    expect(result).toBe(true);
    expect(warehouseRepository.delete).toHaveBeenCalledWith('w1');
  });
});
