/**
 * Update Customer Use Case
 */

import { CustomerRepository } from '../domain/repositories/CustomerRepository';
import { eventBus } from '../../../libs/events/eventBus';

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
      metadata?: Record<string, any>;
    }
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
      throw new Error('Customer not found');
    }

    const updatedFields: string[] = [];

    // Update profile
    if (command.updates.firstName || command.updates.lastName || 
        command.updates.phone !== undefined || command.updates.dateOfBirth !== undefined) {
      customer.updateProfile({
        firstName: command.updates.firstName,
        lastName: command.updates.lastName,
        phone: command.updates.phone,
        dateOfBirth: command.updates.dateOfBirth
      });
      if (command.updates.firstName) updatedFields.push('firstName');
      if (command.updates.lastName) updatedFields.push('lastName');
      if (command.updates.phone !== undefined) updatedFields.push('phone');
      if (command.updates.dateOfBirth !== undefined) updatedFields.push('dateOfBirth');
    }

    // Update preferences
    if (command.updates.preferredCurrency || command.updates.preferredLanguage) {
      customer.setPreferences({
        currency: command.updates.preferredCurrency,
        language: command.updates.preferredLanguage
      });
      if (command.updates.preferredCurrency) updatedFields.push('preferredCurrency');
      if (command.updates.preferredLanguage) updatedFields.push('preferredLanguage');
    }

    // Update notes
    if (command.updates.notes !== undefined) {
      customer.updateNotes(command.updates.notes);
      updatedFields.push('notes');
    }

    // Update metadata
    if (command.updates.metadata) {
      customer.updateMetadata(command.updates.metadata);
      updatedFields.push('metadata');
    }

    // Save
    await this.customerRepository.save(customer);

    // Emit event
    eventBus.emit('customer.updated', {
      customerId: customer.customerId,
      updatedFields
    });

    return {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      updatedFields,
      updatedAt: customer.updatedAt.toISOString()
    };
  }
}
