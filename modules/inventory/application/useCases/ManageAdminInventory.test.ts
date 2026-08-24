jest.mock('../../infrastructure/repositories/InventoryDataRepository', () => ({
  __esModule: true,
  default: {
    admin: {
      findInventoryLevels: jest.fn().mockResolvedValue([{ levelId: 'l1' }]),
      countInventoryLevels: jest.fn().mockResolvedValue(1),
      getInventoryStats: jest.fn().mockResolvedValue({ totalProducts: 100, inStock: 80, lowStock: 20 }),
      findAllLocations: jest.fn().mockResolvedValue([{ locationId: 'loc1' }]),
      findLowStockItems: jest.fn().mockResolvedValue([{ itemId: 'i1' }]),
      findLowStockReport: jest.fn().mockResolvedValue({ lowStockCount: 5 }),
      findInventoryLevelById: jest.fn().mockResolvedValue({ levelId: 'l1' }),
      adjustStockLevel: jest.fn().mockResolvedValue(undefined),
      findTransactionsByLevelId: jest.fn().mockResolvedValue([{ transactionId: 't1' }]),
      countTransactionsByLevelId: jest.fn().mockResolvedValue(3),
      findLocationsWithStats: jest.fn().mockResolvedValue([{ locationId: 'loc1', itemCount: 50 }]),
    },
  },
}));

import { ManageAdminInventoryUseCase } from './ManageAdminInventory';
import inventoryDataRepository from '../../infrastructure/repositories/InventoryDataRepository';

const mockRepo = inventoryDataRepository as unknown as { admin: Record<string, jest.Mock> };

describe('ManageAdminInventoryUseCase', () => {
  let useCase: ManageAdminInventoryUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageAdminInventoryUseCase();
  });

  it('should find inventory levels', async () => {
    const result = await useCase.findInventoryLevels({ storeId: 's1' } as never);
    expect(result).toHaveLength(1);
  });

  it('should get inventory stats', async () => {
    const result = await useCase.getInventoryStats() as unknown as Record<string, unknown>;
    expect(result.totalProducts).toBe(100);
  });

  it('should find all locations', async () => {
    const result = await useCase.findAllLocations();
    expect(result).toHaveLength(1);
  });

  it('should find low stock items', async () => {
    const result = await useCase.findLowStockItems(5);
    expect(result).toHaveLength(1);
    expect(mockRepo.admin.findLowStockItems).toHaveBeenCalledWith(5);
  });

  it('should adjust stock level', async () => {
    await useCase.adjustStockLevel('l1', 50, 40, 'p1', 'loc1', 'increase', 10, 'Restock', null, 'admin');
    expect(mockRepo.admin.adjustStockLevel).toHaveBeenCalledWith('l1', 50, 40, 'p1', 'loc1', 'increase', 10, 'Restock', null, 'admin');
  });

  it('should find transactions by level ID', async () => {
    const result = await useCase.findTransactionsByLevelId('l1', 10, 0);
    expect(result).toHaveLength(1);
  });

  it('should find locations with stats', async () => {
    const result = await useCase.findLocationsWithStats();
    expect(result).toHaveLength(1);
  });
});
