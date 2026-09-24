import '../../tests/testUtils';
import { ManageOperationsUseCase } from './ManageOperations';
import { createAdminOperationsRepository } from '../../tests/testUtils';

describe('ManageOperationsUseCase', () => {
  const adminOperationsRepo = createAdminOperationsRepository();
  const useCase = new ManageOperationsUseCase(adminOperationsRepo);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return operations statistics', async () => {
    adminOperationsRepo.getOperationsStats.mockResolvedValue({
      pendingFulfillments: 100,
      activeWarehouses: 5,
      abandonedCarts: 10,
      lowStockItems: 3,
      totalSuppliers: 12,
      activeSuppliers: 9,
    });

    const result = await useCase.getOperationsStats();

    expect(result.pendingFulfillments).toBe(100);
  });

  it('should return recent fulfillments with the limit forwarded', async () => {
    adminOperationsRepo.findRecentFulfillments.mockResolvedValue([{ fulfillmentId: 'f1' }]);

    const result = await useCase.findRecentFulfillments(10);

    expect(result).toHaveLength(1);
    expect(adminOperationsRepo.findRecentFulfillments).toHaveBeenCalledWith(10);
  });

  it('should return warehouses with fulfillment counts', async () => {
    adminOperationsRepo.findWarehousesWithCounts.mockResolvedValue([{ warehouseId: 'w1', count: 50 }]);

    const result = await useCase.findWarehousesWithCounts();

    expect(result).toHaveLength(1);
  });
});
