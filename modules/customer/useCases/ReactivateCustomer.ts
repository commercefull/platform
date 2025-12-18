/**
 * Reactivate Customer Use Case
 */

import { CustomerRepository } from '../domain/repositories/CustomerRepository';
import { eventBus } from '../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class ReactivateCustomerCommand {
  constructor(
    public readonly customerId: string
  ) {}
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
      throw new Error('Customer ID is required');
    }

    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.status === 'active') {
      throw new Error('Customer is already active');
    }

    // Reactivate customer
    customer.activate();
    await this.customerRepository.save(customer);

    // Emit event
    (eventBus as any).emit('customer.reactivated', {
      customerId: customer.customerId
    });

    return {
      success: true,
      customerId: customer.customerId,
      reactivatedAt: new Date().toISOString()
    };
  }
}
