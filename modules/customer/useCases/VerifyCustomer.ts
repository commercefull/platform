/**
 * Verify Customer Use Case
 */

import { CustomerRepository } from '../domain/repositories/CustomerRepository';
import { eventBus } from '../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class VerifyCustomerCommand {
  constructor(
    public readonly customerId: string,
    public readonly verificationType: 'email' | 'phone' = 'email',
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface VerifyCustomerResponse {
  success: boolean;
  customerId: string;
  email: string;
  verifiedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class VerifyCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: VerifyCustomerCommand): Promise<VerifyCustomerResponse> {
    if (!command.customerId) {
      throw new Error('Customer ID is required');
    }

    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.isVerified) {
      throw new Error('Customer is already verified');
    }

    // Verify based on type
    if (command.verificationType === 'email') {
      await this.customerRepository.verifyEmail(command.customerId);
    } else {
      await this.customerRepository.verifyPhone(command.customerId);
    }

    // Emit event
    (eventBus as any).emit('customer.verified', {
      customerId: customer.customerId,
      email: customer.email,
      verificationType: command.verificationType,
    });

    return {
      success: true,
      customerId: customer.customerId,
      email: customer.email,
      verifiedAt: new Date().toISOString(),
    };
  }
}
