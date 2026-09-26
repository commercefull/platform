/**
 * CleanupExpiredTokens Use Case
 *
 * Removes expired refresh tokens and expired token blacklist entries.
 */

import type { TokenRepository } from '../../../domain/repositories/TokenRepository';

export interface CleanupExpiredTokensResult {
  refreshTokens: number;
  blacklistTokens: number;
}

export class CleanupExpiredTokensUseCase {
  constructor(private readonly tokenRepo: TokenRepository) {}

  async execute(): Promise<CleanupExpiredTokensResult> {
    const refreshTokens = await this.tokenRepo.cleanupExpiredRefreshTokens();
    const blacklistTokens = await this.tokenRepo.cleanExpiredBlacklist();

    return { refreshTokens, blacklistTokens };
  }
}
