import customerDataRepository from '../../infrastructure/repositories/CustomerDataRepository';

const customerRepo = customerDataRepository.customers;
const customerAddressRepo = customerDataRepository.addresses;
const storefrontWishlistRepo = customerDataRepository.wishlist;

export class ManageCustomersUseCase {
  async findById(id: string) {
    return customerRepo.findById(id);
  }
  async findByEmail(email: string) {
    return customerRepo.findByEmail(email);
  }
  async findAll(filters?: Parameters<typeof customerRepo.findAll>[0], pagination?: Parameters<typeof customerRepo.findAll>[1]) {
    return customerRepo.findAll(filters, pagination);
  }
  async save(customer: Parameters<typeof customerRepo.save>[0]) {
    return customerRepo.save(customer);
  }
  async delete(id: string) {
    return customerRepo.delete(id);
  }
  async count(filters?: Parameters<typeof customerRepo.count>[0]) {
    return customerRepo.count(filters);
  }
  async updateLastLogin(customerId: string) {
    return customerRepo.updateLastLogin(customerId);
  }
  async getPasswordHash(customerId: string) {
    return customerRepo.getPasswordHash(customerId);
  }
  async updatePasswordHash(customerId: string, hash: string) {
    return customerRepo.updatePasswordHash(customerId, hash);
  }
  async recordLogin(customerId: string) {
    return customerRepo.recordLogin(customerId);
  }
  async recordFailedLogin(customerId: string) {
    return customerRepo.recordFailedLogin(customerId);
  }
}

export class ManageCustomerAddressesUseCase {
  async findByCustomerId(customerId: string) {
    return customerAddressRepo.findByCustomerId(customerId);
  }
  async findById(id: string) {
    return customerAddressRepo.findById(id);
  }
  async create(params: Parameters<typeof customerAddressRepo.create>[0]) {
    return customerAddressRepo.create(params);
  }
  async update(id: string, params: Parameters<typeof customerAddressRepo.update>[1]) {
    return customerAddressRepo.update(id, params);
  }
  async softDelete(id: string, customerId: string) {
    return customerAddressRepo.softDelete(id, customerId);
  }
  async findActiveByCustomerId(customerId: string) {
    return customerAddressRepo.findActiveByCustomerId(customerId);
  }
  async findActiveById(id: string, customerId: string) {
    return customerAddressRepo.findActiveById(id, customerId);
  }
}

export class ManageWishlistUseCase {
  async findByCustomer(customerId: string) {
    return storefrontWishlistRepo.findByCustomer(customerId);
  }
  async findExisting(customerId: string, productId: string) {
    return storefrontWishlistRepo.findExisting(customerId, productId);
  }
  async create(customerId: string, productId: string) {
    return storefrontWishlistRepo.create(customerId, productId);
  }
  async remove(customerId: string, productId: string) {
    return storefrontWishlistRepo.remove(customerId, productId);
  }
}
