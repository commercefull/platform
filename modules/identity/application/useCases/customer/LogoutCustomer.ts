/**
 * LogoutCustomer Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface LogoutCustomerInput {
  customerId: string;
  accessToken: string;
  refreshToken?: string;
  logoutAll?: boolean;
}

export interface LogoutCustomerOutput {
  success: boolean;
  message: string;
}

export class LogoutCustomerUseCase {
  constructor(
    private readonly tokenBlacklistRepo: any,
    private readonly refreshTokenRepo: any
  ) {}

  async execute(input: LogoutCustomerInput): Promise<LogoutCustomerOutput> {
    if (!input.customerId || !input.accessToken) {
      throw new Error('Customer ID and access token are required');
    }

    // Blacklist the current access token
    await this.tokenBlacklistRepo.add({
      token: input.accessToken,
      customerId: input.customerId,
      type: 'access',
      blacklistedAt: new Date(),
    });

    if (input.logoutAll) {
      // Revoke all refresh tokens for this customer
      await this.refreshTokenRepo.revokeAllForCustomer(input.customerId);
    } else if (input.refreshToken) {
      // Revoke only the current refresh token
      await this.refreshTokenRepo.revoke(input.refreshToken);
    }

    // Emit event
    eventBus.emit('customer.logged_out', {
      customerId: input.customerId,
      logoutAll: input.logoutAll ?? false,
    });

    return {
      success: true,
      message: input.logoutAll ? 'Logged out from all devices' : 'Logged out successfully',
    };
  }
}
