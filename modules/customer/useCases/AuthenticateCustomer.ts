/**
 * Authenticate Customer Use Case
 */

import { CustomerRepository } from '../domain/repositories/CustomerRepository';

// ============================================================================
// Command
// ============================================================================

export class AuthenticateCustomerCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface AuthenticateCustomerResponse {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
}

// ============================================================================
// Use Case
// ============================================================================

export class AuthenticateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: AuthenticateCustomerCommand): Promise<AuthenticateCustomerResponse | null> {
    if (!command.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!command.password) {
      throw new Error('Password is required');
    }

    const customer = await this.customerRepository.findByEmail(command.email);
    if (!customer) {
      return null;
    }

    // Get password hash
    const passwordHash = await this.customerRepository.getPasswordHash(customer.customerId);
    if (!passwordHash) {
      return null;
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(command.password, passwordHash);

    if (!isValid) {
      return null;
    }

    // Record successful login
    await this.customerRepository.recordLogin(customer.customerId);

    return {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      isVerified: customer.isVerified,
    };
  }
}
