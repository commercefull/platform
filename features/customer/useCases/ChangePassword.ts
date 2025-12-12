/**
 * Change Password Use Case
 */

import { CustomerRepository } from '../domain/repositories/CustomerRepository';
import { eventBus } from '../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class ChangePasswordCommand {
  constructor(
    public readonly customerId: string,
    public readonly currentPassword: string,
    public readonly newPassword: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ChangePasswordResponse {
  success: boolean;
  customerId: string;
  changedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ChangePasswordUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: ChangePasswordCommand): Promise<ChangePasswordResponse> {
    if (!command.customerId) {
      throw new Error('Customer ID is required');
    }
    if (!command.currentPassword) {
      throw new Error('Current password is required');
    }
    if (!command.newPassword || command.newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify current password
    const bcrypt = await import('bcryptjs');
    const currentHash = await this.customerRepository.getPasswordHash(command.customerId);
    if (!currentHash) {
      throw new Error('Password not set');
    }

    const isValid = await bcrypt.compare(command.currentPassword, currentHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(command.newPassword, 12);
    await this.customerRepository.updatePassword(command.customerId, newHash);

    // Emit event
    (eventBus as any).emit('customer.password_changed', {
      customerId: customer.customerId
    });

    return {
      success: true,
      customerId: customer.customerId,
      changedAt: new Date().toISOString()
    };
  }
}
