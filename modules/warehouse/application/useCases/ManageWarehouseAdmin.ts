import type { WarehouseRecord, WarehouseStatistics } from '../../domain/repositories/WarehouseRepository';

interface WarehouseAdminRepositoryPort {
  findAll(activeOnly?: boolean): Promise<WarehouseRecord[]>;
  getStatistics(): Promise<WarehouseStatistics>;
}

export class ManageWarehouseAdminUseCase {
  constructor(private readonly warehouseRepo: WarehouseAdminRepositoryPort) {}

  async findAll(activeOnly?: boolean) {
    return this.warehouseRepo.findAll(activeOnly);
  }
  async getStatistics() {
    return this.warehouseRepo.getStatistics();
  }
}
