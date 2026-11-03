/**
 * CustomerCredentialSubjectAdapter
 *
 * ACL adapter implementing identity's CredentialSubjectPort.
 * Translates customer's CustomerRepo into identity's CredentialSubject vocabulary.
 *
 * Only this adapter may import from customer's infrastructure.
 */

import { CredentialSubjectPort, CredentialSubject, CreateCredentialSubjectData } from '../../application/ports/CredentialSubjectPort';
import type { CustomerCredentialRepository } from '../../../customer/domain/repositories/CustomerCredentialRepository';
import type { CustomerRepository } from '../../../customer/domain/repositories/CustomerRepository';
import { RegisterCustomerCommand, RegisterCustomerUseCase } from '../../../customer/application/useCases/RegisterCustomer';

export class CustomerCredentialSubjectAdapter implements CredentialSubjectPort {
  constructor(
    private readonly credentials: CustomerCredentialRepository,
    private readonly customers: CustomerRepository,
  ) {}

  async authenticate(email: string, password: string): Promise<CredentialSubject | null> {
    const result = await this.credentials.authenticate({ email, password });
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
    const customer = await this.customers.findById(id);
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
    const customer = await this.customers.findByEmail(email);
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
    // Single creation path: customer's RegisterCustomerUseCase owns validation,
    // duplicate checks, transaction, and the customer.registered event.
    // Empty/absent password creates a passwordless (provider-only) account.
    const result = await new RegisterCustomerUseCase(this.customers).execute(
      new RegisterCustomerCommand({
        email: data.email,
        firstName: data.firstName || data.name || '',
        lastName: data.lastName ?? '',
        password: data.password || undefined,
        phone: data.phone,
        flags: { isActive: data.isActive, isVerified: data.isVerified },
      }),
    );
    return {
      id: result.customerId,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      status: (data.isActive ?? true) ? 'active' : 'inactive',
      isActive: data.isActive ?? true,
      isVerified: result.isVerified,
    };
  }

  async updateLoginTimestamp(id: string): Promise<void> {
    await this.customers.updateLastLogin(id);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    await this.credentials.changePassword(id, newPassword);
  }

  async createEmailVerificationToken(id: string): Promise<string> {
    return this.credentials.createEmailVerificationToken(id);
  }

  async verifyEmailVerificationToken(token: string): Promise<string | null> {
    return this.credentials.verifyEmailVerificationToken(token);
  }

  async createPasswordResetToken(id: string): Promise<string> {
    return this.credentials.createPasswordResetToken(id);
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    return this.credentials.verifyPasswordResetToken(token);
  }
}
