import type { CustomerAddressRepository, CustomerAddressCreateParams, CustomerAddressUpdateParams } from '../../domain/repositories/CustomerAddressRepository';

export class ManageStorefrontAddressesUseCase {
  constructor(private readonly customerAddressRepo: CustomerAddressRepository) {}

  async findActiveByCustomerId(customerId: string) {
    return this.customerAddressRepo.findActiveByCustomerId(customerId);
  }
  async findActiveById(id: string, customerId: string) {
    return this.customerAddressRepo.findActiveById(id, customerId);
  }
  async create(params: Partial<CustomerAddressCreateParams> & { customerId: string }) {
    return this.customerAddressRepo.create(params as CustomerAddressCreateParams);
  }
  async update(id: string, params: Partial<CustomerAddressUpdateParams>) {
    return this.customerAddressRepo.update(id, params as CustomerAddressUpdateParams);
  }
  async softDelete(id: string, customerId: string) {
    return this.customerAddressRepo.softDelete(id, customerId);
  }
  async unsetDefaultsExcept(customerId: string, exceptId: string) {
    return this.customerAddressRepo.unsetDefaultsExcept(customerId, exceptId);
  }
}
