import supplierDataRepository from '../../infrastructure/repositories/SupplierDataRepository';

const supplierRepo = supplierDataRepository.suppliers;

export class ManageSuppliersAdminUseCase {
  async findAll(activeOnly?: boolean, approvedOnly?: boolean) {
    return supplierRepo.findAll(activeOnly, approvedOnly);
  }
  async findByStatus(status: string) {
    return supplierRepo.findByStatus(status as Parameters<typeof supplierRepo.findByStatus>[0]);
  }
  async getStatistics() {
    return supplierRepo.getStatistics();
  }
  async findById(id: string) {
    return supplierRepo.findById(id);
  }
  async create(params: Parameters<typeof supplierRepo.create>[0]) {
    return supplierRepo.create(params);
  }
  async update(id: string, params: Parameters<typeof supplierRepo.update>[1]) {
    return supplierRepo.update(id, params);
  }
  async approve(id: string) {
    return supplierRepo.approve(id);
  }
  async suspend(id: string) {
    return supplierRepo.suspend(id);
  }
  async activate(id: string) {
    return supplierRepo.activate(id);
  }
  async deactivate(id: string) {
    return supplierRepo.deactivate(id);
  }
  async delete(id: string) {
    return supplierRepo.delete(id);
  }
}
