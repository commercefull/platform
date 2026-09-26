/**
 * LogoutSession Use Case
 *
 * Invalidates an authenticated session: blacklists the current access token and
 * optionally revokes the supplied refresh token.
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import type { TokenRepository } from '../../../domain/repositories/TokenRepository';
import type { TokenSubjectType } from './IssueTokenPair';

const BLACKLIST_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class LogoutSessionCommand {
  constructor(
    public readonly userId: string,
    public readonly userType: TokenSubjectType,
    public readonly accessToken: string,
    public readonly refreshToken?: string,
  ) {}
}

export class LogoutSessionUseCase {
  constructor(private readonly tokenRepo: TokenRepository) {}

  /** Revoke every refresh token for a user (admin force-logout). */
  async revokeAllForUser(userId: string, userType?: string): Promise<number> {
    return this.tokenRepo.revokeAllForUserWithType(userId, userType);
  }

  async execute(command: LogoutSessionCommand): Promise<void> {
    await this.tokenRepo.blacklistToken({
      token: command.accessToken,
      userId: command.userId,
      userType: command.userType,
      expiresAt: new Date(Date.now() + BLACKLIST_TTL_MS),
    });

    if (command.refreshToken) {
      await this.tokenRepo.revokeRefreshToken(command.refreshToken);
    }

    if (command.userType === 'customer') {
      eventBus.emit('customer.logged_out', { customerId: command.userId });
    }
  }
}
