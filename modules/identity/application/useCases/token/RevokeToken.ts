/**
 * RevokeToken Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { TokenRequiredOnlyError, UserIdRequiredError } from '../../../domain/errors/IdentityErrors';

export interface RevokeTokenInput {
  token: string;
  tokenType: 'access' | 'refresh';
  userId: string;
  userType: 'customer' | 'organization';
}

export interface RevokeAllTokensInput {
  userId: string;
  userType: 'customer' | 'organization';
}

export interface RevokeTokenOutput {
  success: boolean;
  revokedCount: number;
}

export interface TokenBlacklistRepository {
  add(entry: { token: string; type: string; blacklistedAt: Date; [key: string]: unknown }): Promise<void>;
}

export interface RefreshTokenRepository {
  revoke(token: string): Promise<void>;
  revokeAllForCustomer(customerId: string): Promise<number>;
  revokeAllForMerchant(organizationId: string): Promise<number>;
}

export class RevokeTokenUseCase {
  constructor(
    private readonly tokenBlacklistRepo: TokenBlacklistRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async revokeOne(input: RevokeTokenInput): Promise<RevokeTokenOutput> {
    if (!input.token) {
      throw new TokenRequiredOnlyError();
    }

    if (input.tokenType === 'access') {
      await this.tokenBlacklistRepo.add({
        token: input.token,
        [input.userType === 'customer' ? 'customerId' : 'organizationId']: input.userId,
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
      throw new UserIdRequiredError();
    }

    const revokedCount =
      input.userType === 'customer'
        ? await this.refreshTokenRepo.revokeAllForCustomer(input.userId)
        : await this.refreshTokenRepo.revokeAllForMerchant(input.userId);

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
