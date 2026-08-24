import warehouseDataRepository from '../../infrastructure/repositories/WarehouseDataRepository';

const warehouseRepo = warehouseDataRepository.warehouses;

export class ManageWarehouseAdminUseCase {
  async findAll(activeOnly?: boolean) {
    return warehouseRepo.findAll(activeOnly);
  }
  async getStatistics() {
    return warehouseRepo.getStatistics();
  }
}
