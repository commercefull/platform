import warehouseDataRepository from '../../infrastructure/repositories/WarehouseDataRepository';

const warehouseRepo = warehouseDataRepository.warehouses;

export class ManageWarehouseAdminUseCaseV2 {
  async findAll(activeOnly?: boolean) {
    return warehouseRepo.findAll(activeOnly);
  }
  async getStatistics() {
    return warehouseRepo.getStatistics();
  }
  async findById(id: string) {
    return warehouseRepo.findById(id);
  }
  async create(params: Parameters<typeof warehouseRepo.create>[0]) {
    return warehouseRepo.create(params);
  }
  async update(id: string, params: Parameters<typeof warehouseRepo.update>[1]) {
    return warehouseRepo.update(id, params);
  }
  async activate(id: string) {
    return warehouseRepo.activate(id);
  }
  async deactivate(id: string) {
    return warehouseRepo.deactivate(id);
  }
  async delete(id: string) {
    return warehouseRepo.delete(id);
  }
}
