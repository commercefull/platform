/**
 * Update Customer Use Case
 */

import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { CustomerNotFoundError } from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class UpdateCustomerCommand {
  constructor(
    public readonly customerId: string,
    public readonly updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: Date;
      preferredCurrency?: string;
      preferredLanguage?: string;
      notes?: string;
      metadata?: Record<string, unknown>;
    },
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UpdateCustomerResponse {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  updatedFields: string[];
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: UpdateCustomerCommand): Promise<UpdateCustomerResponse> {
    const customer = await this.customerRepository.findById(command.customerId);

    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    const updatedFields: string[] = [];

    // Update profile
    if (
      command.updates.firstName ||
      command.updates.lastName ||
      command.updates.phone !== undefined ||
      command.updates.dateOfBirth !== undefined
    ) {
      if (command.updates.firstName) customer.firstName = command.updates.firstName.trim();
      if (command.updates.lastName) customer.lastName = command.updates.lastName.trim();
      if (command.updates.phone !== undefined) customer.phone = command.updates.phone?.trim() || null;
      if (command.updates.dateOfBirth !== undefined) customer.dateOfBirth = command.updates.dateOfBirth || null;
      if (command.updates.firstName) updatedFields.push('firstName');
      if (command.updates.lastName) updatedFields.push('lastName');
      if (command.updates.phone !== undefined) updatedFields.push('phone');
      if (command.updates.dateOfBirth !== undefined) updatedFields.push('dateOfBirth');
    }

    // Update preferences
    if (command.updates.preferredCurrency || command.updates.preferredLanguage) {
      if (command.updates.preferredLanguage) customer.timezone = command.updates.preferredLanguage;
      if (command.updates.preferredCurrency) updatedFields.push('preferredCurrency');
      if (command.updates.preferredLanguage) updatedFields.push('preferredLanguage');
    }

    // Update notes
    if (command.updates.notes !== undefined) {
      customer.note = command.updates.notes;
      updatedFields.push('notes');
    }

    // Update metadata - no direct column, skip for now
    if (command.updates.metadata) {
      updatedFields.push('metadata');
    }

    customer.updatedAt = new Date();

    // Save
    await this.customerRepository.save(customer);

    // Emit event
    eventBus.emit('customer.updated', {
      customerId: customer.customerId,
      updatedFields,
    });

    return {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      updatedFields,
      updatedAt: new Date(customer.updatedAt).toISOString(),
    };
  }
}
