import type { CustomerAddressRepository } from '../../domain/repositories/CustomerAddressRepository';

export class ManageCustomerAddressesUseCase {
  constructor(private readonly customerAddressRepo: CustomerAddressRepository) {}

  async findByCustomerId(customerId: string) {
    return this.customerAddressRepo.findByCustomerId(customerId);
  }
  async findById(id: string) {
    return this.customerAddressRepo.findById(id);
  }
  async create(params: Parameters<CustomerAddressRepository['create']>[0]) {
    return this.customerAddressRepo.create(params);
  }
  async update(id: string, params: Parameters<CustomerAddressRepository['update']>[1]) {
    return this.customerAddressRepo.update(id, params);
  }
  async softDelete(id: string, customerId: string) {
    return this.customerAddressRepo.softDelete(id, customerId);
  }
  async findActiveByCustomerId(customerId: string) {
    return this.customerAddressRepo.findActiveByCustomerId(customerId);
  }
  async findActiveById(id: string, customerId: string) {
    return this.customerAddressRepo.findActiveById(id, customerId);
  }
}

