/**
 * Deactivate Customer Use Case
 */

import { CustomerRepository } from '../domain/repositories/CustomerRepository';
import { eventBus } from '../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class DeactivateCustomerCommand {
  constructor(
    public readonly customerId: string,
    public readonly reason?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface DeactivateCustomerResponse {
  success: boolean;
  customerId: string;
  deactivatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class DeactivateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: DeactivateCustomerCommand): Promise<DeactivateCustomerResponse> {
    if (!command.customerId) {
      throw new Error('Customer ID is required');
    }

    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.status === 'inactive') {
      throw new Error('Customer is already deactivated');
    }

    // Deactivate customer
    customer.deactivate();
    await this.customerRepository.save(customer);

    // Emit event
    (eventBus as any).emit('customer.deactivated', {
      customerId: customer.customerId,
      reason: command.reason,
    });

    return {
      success: true,
      customerId: customer.customerId,
      deactivatedAt: new Date().toISOString(),
    };
  }
}
