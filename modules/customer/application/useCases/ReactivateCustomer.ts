/**
 * Reactivate Customer Use Case
 */

import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { CustomerNotFoundError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class ReactivateCustomerCommand {
  constructor(public readonly customerId: string) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ReactivateCustomerResponse {
  success: boolean;
  customerId: string;
  reactivatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ReactivateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: ReactivateCustomerCommand): Promise<ReactivateCustomerResponse> {
    if (!command.customerId) {
      throw new CustomerValidationError('Customer ID is required');
    }

    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    if (customer.isActive) {
      throw new CustomerValidationError('Customer is already active');
    }

    // Reactivate customer
    customer.isActive = true;
    customer.updatedAt = new Date();
    await this.customerRepository.save(customer);

    // Emit event
    eventBus.emit('customer.reactivated', {
      customerId: customer.customerId,
    });

    return {
      success: true,
      customerId: customer.customerId,
      reactivatedAt: new Date().toISOString(),
    };
  }
}
