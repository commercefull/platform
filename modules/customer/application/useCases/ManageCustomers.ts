import type { CustomerRepository } from '../../domain/repositories/CustomerRepository';

export class ManageCustomersUseCase {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async findById(id: string) {
    return this.customerRepo.findById(id);
  }
  async findByEmail(email: string) {
    return this.customerRepo.findByEmail(email);
  }
  async findAll(filters?: Parameters<CustomerRepository['findAll']>[0], pagination?: Parameters<CustomerRepository['findAll']>[1]) {
    return this.customerRepo.findAll(filters, pagination);
  }
  async save(customer: Parameters<CustomerRepository['save']>[0]) {
    return this.customerRepo.save(customer);
  }
  async delete(id: string) {
    return this.customerRepo.delete(id);
  }
  async count(filters?: Parameters<CustomerRepository['count']>[0]) {
    return this.customerRepo.count(filters);
  }
  async updateLastLogin(customerId: string) {
    return this.customerRepo.updateLastLogin(customerId);
  }
  async getPasswordHash(customerId: string) {
    return this.customerRepo.getPasswordHash(customerId);
  }
  async updatePasswordHash(customerId: string, hash: string) {
    return this.customerRepo.updatePasswordHash(customerId, hash);
  }
  async recordLogin(customerId: string) {
    return this.customerRepo.recordLogin(customerId);
  }
  async recordFailedLogin(customerId: string) {
    return this.customerRepo.recordFailedLogin(customerId);
  }
}

