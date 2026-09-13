import type { CustomerAddressRepository, CustomerAddressCreateParams, CustomerAddressUpdateParams } from '../../domain/repositories/CustomerAddressRepository';
import { customerDataRepository } from '../wired';

const customerAddressRepo: CustomerAddressRepository = customerDataRepository.addresses;

export class ManageStorefrontAddressesUseCase {
  async findActiveByCustomerId(customerId: string) {
    return customerAddressRepo.findActiveByCustomerId(customerId);
  }
  async findActiveById(id: string, customerId: string) {
    return customerAddressRepo.findActiveById(id, customerId);
  }
  async create(params: Partial<CustomerAddressCreateParams> & { customerId: string }) {
    return customerAddressRepo.create(params as CustomerAddressCreateParams);
  }
  async update(id: string, params: Partial<CustomerAddressUpdateParams>) {
    return customerAddressRepo.update(id, params as CustomerAddressUpdateParams);
  }
  async softDelete(id: string, customerId: string) {
    return customerAddressRepo.softDelete(id, customerId);
  }
  async unsetDefaultsExcept(customerId: string, exceptId: string) {
    return customerAddressRepo.unsetDefaultsExcept(customerId, exceptId);
  }
}
