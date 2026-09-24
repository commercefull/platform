import type { SupplierStatus } from '../../domain/entities/Supplier';
import type { SupplierRepository, SupplierCreateParams, SupplierUpdateParams } from '../../domain/repositories/SupplierRepository';

export class ManageSuppliersAdminUseCase {
  constructor(private readonly supplierRepo: SupplierRepository) {}

  async findAll(activeOnly?: boolean, approvedOnly?: boolean) {
    return this.supplierRepo.findAll(activeOnly, approvedOnly);
  }
  async findByStatus(status: SupplierStatus) {
    return this.supplierRepo.findByStatus(status);
  }
  async getStatistics() {
    return this.supplierRepo.getStatistics();
  }
  async findById(id: string) {
    return this.supplierRepo.findById(id);
  }
  async create(params: SupplierCreateParams) {
    return this.supplierRepo.create(params);
  }
  async update(id: string, params: SupplierUpdateParams) {
    return this.supplierRepo.update(id, params);
  }
  async approve(id: string) {
    return this.supplierRepo.approve(id);
  }
  async suspend(id: string) {
    return this.supplierRepo.suspend(id);
  }
  async activate(id: string) {
    return this.supplierRepo.activate(id);
  }
  async deactivate(id: string) {
    return this.supplierRepo.deactivate(id);
  }
  async delete(id: string) {
    return this.supplierRepo.delete(id);
  }
}
