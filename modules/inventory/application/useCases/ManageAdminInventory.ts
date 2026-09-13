import { AdminInventoryRepository } from '../../domain/repositories/AdminInventoryRepository';

export class ManageAdminInventoryUseCase {
  constructor(private readonly adminInventoryRepo: AdminInventoryRepository) {}

  async findInventoryLevels(params: Parameters<AdminInventoryRepository['findInventoryLevels']>[0]) {
    return this.adminInventoryRepo.findInventoryLevels(params);
  }
  async countInventoryLevels(params: Parameters<AdminInventoryRepository['countInventoryLevels']>[0]) {
    return this.adminInventoryRepo.countInventoryLevels(params);
  }
  async getInventoryStats() {
    return this.adminInventoryRepo.getInventoryStats();
  }
  async findAllLocations() {
    return this.adminInventoryRepo.findAllLocations();
  }
  async findLowStockItems(limit: number = 10) {
    return this.adminInventoryRepo.findLowStockItems(limit);
  }
  async findLowStockReport() {
    return this.adminInventoryRepo.findLowStockReport();
  }
  async findInventoryLevelById(id: string) {
    return this.adminInventoryRepo.findInventoryLevelById(id);
  }
  async adjustStockLevel(...args: Parameters<AdminInventoryRepository['adjustStockLevel']>) {
    return this.adminInventoryRepo.adjustStockLevel(...args);
  }
  async findTransactionsByLevelId(levelId: string, limit: number, offset: number) {
    return this.adminInventoryRepo.findTransactionsByLevelId(levelId, limit, offset);
  }
  async countTransactionsByLevelId(levelId: string) {
    return this.adminInventoryRepo.countTransactionsByLevelId(levelId);
  }
  async findLocationsWithStats() {
    return this.adminInventoryRepo.findLocationsWithStats();
  }
}
