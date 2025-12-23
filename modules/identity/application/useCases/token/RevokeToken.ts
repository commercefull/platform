/**
 * RevokeToken Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface RevokeTokenInput {
  token: string;
  tokenType: 'access' | 'refresh';
  userId: string;
  userType: 'customer' | 'merchant';
}

export interface RevokeAllTokensInput {
  userId: string;
  userType: 'customer' | 'merchant';
}

export interface RevokeTokenOutput {
  success: boolean;
  revokedCount: number;
}

export class RevokeTokenUseCase {
  constructor(
    private readonly tokenBlacklistRepo: any,
    private readonly refreshTokenRepo: any,
  ) {}

  async revokeOne(input: RevokeTokenInput): Promise<RevokeTokenOutput> {
    if (!input.token) {
      throw new Error('Token is required');
    }

    if (input.tokenType === 'access') {
      await this.tokenBlacklistRepo.add({
        token: input.token,
        [input.userType === 'customer' ? 'customerId' : 'merchantId']: input.userId,
        type: 'access',
        blacklistedAt: new Date(),
      });
    } else {
      await this.refreshTokenRepo.revoke(input.token);
    }

    return {
      success: true,
      revokedCount: 1,
    };
  }

  async revokeAll(input: RevokeAllTokensInput): Promise<RevokeTokenOutput> {
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    let revokedCount = 0;

    if (input.userType === 'customer') {
      revokedCount = await this.refreshTokenRepo.revokeAllForCustomer(input.userId);
    } else {
      revokedCount = await this.refreshTokenRepo.revokeAllForMerchant(input.userId);
    }

    eventBus.emit(`${input.userType}.all_tokens_revoked`, {
      userId: input.userId,
      revokedCount,
    });

    return {
      success: true,
      revokedCount,
    };
  }
}
