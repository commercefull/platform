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

type Customer = Awaited<ReturnType<CustomerRepository['findById']>> & object;
type CustomerUpdates = UpdateCustomerCommand['updates'];

export class UpdateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: UpdateCustomerCommand): Promise<UpdateCustomerResponse> {
    const customer = await this.customerRepository.findById(command.customerId);

    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    const updatedFields: string[] = [];
    this.applyProfile(customer, command.updates, updatedFields);
    this.applyPreferences(customer, command.updates, updatedFields);
    this.applyNotesAndMetadata(customer, command.updates, updatedFields);

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

  private applyProfile(customer: Customer, updates: CustomerUpdates, updatedFields: string[]): void {
    if (!updates.firstName && !updates.lastName && updates.phone === undefined && updates.dateOfBirth === undefined) return;
    if (updates.firstName) customer.firstName = updates.firstName.trim();
    if (updates.lastName) customer.lastName = updates.lastName.trim();
    if (updates.phone !== undefined) customer.phone = updates.phone?.trim() || null;
    if (updates.dateOfBirth !== undefined) customer.dateOfBirth = updates.dateOfBirth || null;
    this.trackField(updatedFields, 'firstName', updates.firstName);
    this.trackField(updatedFields, 'lastName', updates.lastName);
    this.trackField(updatedFields, 'phone', updates.phone !== undefined);
    this.trackField(updatedFields, 'dateOfBirth', updates.dateOfBirth !== undefined);
  }

  private applyPreferences(customer: Customer, updates: CustomerUpdates, updatedFields: string[]): void {
    if (!updates.preferredCurrency && !updates.preferredLanguage) return;
    if (updates.preferredLanguage) customer.timezone = updates.preferredLanguage;
    this.trackField(updatedFields, 'preferredCurrency', updates.preferredCurrency);
    this.trackField(updatedFields, 'preferredLanguage', updates.preferredLanguage);
  }

  private applyNotesAndMetadata(customer: Customer, updates: CustomerUpdates, updatedFields: string[]): void {
    if (updates.notes !== undefined) {
      customer.note = updates.notes;
      updatedFields.push('notes');
    }

    // Update metadata - no direct column, skip for now
    if (updates.metadata) {
      updatedFields.push('metadata');
    }
  }

  private trackField(updatedFields: string[], field: string, present: unknown): void {
    if (present) updatedFields.push(field);
  }
}
