/**
 * Delete Customer Use Case
 */

import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { CustomerNotFoundError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class DeleteCustomerCommand {
  constructor(
    public readonly customerId: string,
    public readonly reason?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface DeleteCustomerResponse {
  success: boolean;
  customerId: string;
  deletedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class DeleteCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: DeleteCustomerCommand): Promise<DeleteCustomerResponse> {
    if (!command.customerId) {
      throw new CustomerValidationError('Customer ID is required');
    }

    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    // Soft delete - mark as deleted
    await this.customerRepository.delete(command.customerId);

    // Emit event
    eventBus.emit('customer.deleted', {
      customerId: customer.customerId,
      email: customer.email,
      reason: command.reason,
    });

    return {
      success: true,
      customerId: command.customerId,
      deletedAt: new Date().toISOString(),
    };
  }
}
