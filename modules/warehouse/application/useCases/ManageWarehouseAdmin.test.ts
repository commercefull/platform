import '../../tests/testUtils';
import { ManageWarehouseAdminUseCase } from './ManageWarehouseAdmin';
import { createWarehouseRepository } from '../../tests/testUtils';

describe('ManageWarehouseAdminUseCase', () => {
  const warehouseRepository = createWarehouseRepository();
  const useCase = new ManageWarehouseAdminUseCase(warehouseRepository);

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
});
