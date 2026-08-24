import inventoryDataRepository from '../../infrastructure/repositories/InventoryDataRepository';

const adminInventoryRepo = inventoryDataRepository.admin;

export class ManageAdminInventoryUseCase {
  async findInventoryLevels(params: Parameters<typeof adminInventoryRepo.findInventoryLevels>[0]) {
    return adminInventoryRepo.findInventoryLevels(params);
  }
  async countInventoryLevels(params: Parameters<typeof adminInventoryRepo.countInventoryLevels>[0]) {
    return adminInventoryRepo.countInventoryLevels(params);
  }
  async getInventoryStats() {
    return adminInventoryRepo.getInventoryStats();
  }
  async findAllLocations() {
    return adminInventoryRepo.findAllLocations();
  }
  async findLowStockItems(limit: number = 10) {
    return adminInventoryRepo.findLowStockItems(limit);
  }
  async findLowStockReport() {
    return adminInventoryRepo.findLowStockReport();
  }
  async findInventoryLevelById(id: string) {
    return adminInventoryRepo.findInventoryLevelById(id);
  }
  async adjustStockLevel(...args: Parameters<typeof adminInventoryRepo.adjustStockLevel>) {
    return adminInventoryRepo.adjustStockLevel(...args);
  }
  async findTransactionsByLevelId(levelId: string, limit: number, offset: number) {
    return adminInventoryRepo.findTransactionsByLevelId(levelId, limit, offset);
  }
  async countTransactionsByLevelId(levelId: string) {
    return adminInventoryRepo.countTransactionsByLevelId(levelId);
  }
  async findLocationsWithStats() {
    return adminInventoryRepo.findLocationsWithStats();
  }
}
