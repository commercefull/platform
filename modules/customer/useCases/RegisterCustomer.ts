/**
 * Register Customer Use Case
 */

import { generateUUID } from '../../../libs/uuid';
import { Customer } from '../domain/entities/Customer';
import { eventBus } from '../../../libs/events/eventBus';
import { CustomerRepository } from '../domain/repositories/CustomerRepository';

// ============================================================================
// Command
// ============================================================================

export class RegisterCustomerCommand {
  constructor(
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly password: string,
    public readonly phone?: string,
    public readonly dateOfBirth?: Date,
    public readonly preferredCurrency?: string,
    public readonly preferredLanguage?: string,
    public readonly metadata?: Record<string, any>
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface RegisterCustomerResponse {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class RegisterCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: RegisterCustomerCommand): Promise<RegisterCustomerResponse> {
    // Validate
    if (!command.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!command.firstName?.trim()) {
      throw new Error('First name is required');
    }
    if (!command.lastName?.trim()) {
      throw new Error('Last name is required');
    }
    if (!command.password || command.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check for existing customer
    const existing = await this.customerRepository.findByEmail(command.email);
    if (existing) {
      throw new Error('Customer with this email already exists');
    }

    const customerId = generateUUID();

    // Create customer
    const customer = Customer.create({
      customerId,
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
      phone: command.phone,
      dateOfBirth: command.dateOfBirth,
      preferredCurrency: command.preferredCurrency,
      preferredLanguage: command.preferredLanguage,
      metadata: command.metadata
    });

    // Save customer
    await this.customerRepository.save(customer);

    // Hash and store password (would use bcrypt in real implementation)
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(command.password, 12);
    await this.customerRepository.updatePassword(customerId, passwordHash);

    // Emit event
    eventBus.emit('customer.registered', {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName
    });

    return {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt.toISOString()
    };
  }
}
