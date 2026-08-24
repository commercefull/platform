/**
 * CustomerCredentialSubjectAdapter
 *
 * ACL adapter implementing identity's CredentialSubjectPort.
 * Translates customer's CustomerRepo into identity's CredentialSubject vocabulary.
 *
 * Only this adapter may import from customer's infrastructure.
 */

import { CredentialSubjectPort, CredentialSubject, CreateCredentialSubjectData } from '../../application/ports/CredentialSubjectPort';
import customerDataRepository from '../../../customer/infrastructure/repositories/CustomerDataRepository';
import type { CustomerRepo as CustomerRepoType } from '../../../customer/infrastructure/repositories/customerRepo';

export class CustomerCredentialSubjectAdapter implements CredentialSubjectPort {
  private readonly customerRepo: CustomerRepoType;

  constructor(customerRepo?: CustomerRepoType) {
    this.customerRepo = customerRepo ?? customerDataRepository.legacy;
  }

  async authenticate(email: string, password: string): Promise<CredentialSubject | null> {
    const result = await this.customerRepo.authenticateCustomer({ email, password });
    if (!result) return null;
    return {
      id: result.customerId,
      email: result.email,
      firstName: result.firstName ?? undefined,
      lastName: result.lastName ?? undefined,
      status: 'active',
      isActive: true,
      isVerified: false,
    };
  }

  async findById(id: string): Promise<CredentialSubject | null> {
    const customer = await this.customerRepo.findCustomerById(id);
    if (!customer) return null;
    return {
      id: customer.customerId,
      email: customer.email,
      firstName: customer.firstName ?? undefined,
      lastName: customer.lastName ?? undefined,
      status: customer.isActive ? 'active' : 'inactive',
      isActive: customer.isActive,
      isVerified: customer.isVerified ?? false,
      lastLoginAt: customer.lastLoginAt ?? null,
    };
  }

  async findByEmail(email: string): Promise<CredentialSubject | null> {
    const customer = await this.customerRepo.findCustomerByEmail(email);
    if (!customer) return null;
    return {
      id: customer.customerId,
      email: customer.email,
      firstName: customer.firstName ?? undefined,
      lastName: customer.lastName ?? undefined,
      status: customer.isActive ? 'active' : 'inactive',
      isActive: customer.isActive,
      isVerified: customer.isVerified ?? false,
      lastLoginAt: customer.lastLoginAt ?? null,
    };
  }

  async createWithPassword(data: CreateCredentialSubjectData): Promise<CredentialSubject> {
    const customer = await this.customerRepo.createCustomerWithPassword({
      email: data.email,
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      password: data.password,
      phone: data.phone,
      isActive: data.isActive ?? true,
      isVerified: data.isVerified ?? false,
    });
    return {
      id: customer.customerId,
      email: customer.email,
      firstName: customer.firstName ?? undefined,
      lastName: customer.lastName ?? undefined,
      status: customer.isActive ? 'active' : 'inactive',
      isActive: customer.isActive,
      isVerified: customer.isVerified ?? false,
    };
  }

  async updateLoginTimestamp(id: string): Promise<void> {
    await this.customerRepo.updateCustomerLoginTimestamp(id);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    await this.customerRepo.changePassword(id, newPassword);
  }

  async createPasswordResetToken(id: string): Promise<string> {
    return this.customerRepo.createPasswordResetToken(id);
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    return this.customerRepo.verifyPasswordResetToken(token);
  }
}
