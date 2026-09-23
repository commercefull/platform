import type { SocialAccountRepository } from '../../domain/repositories/SocialAccountRepository';
import { SocialProvider, UserType } from '../../domain/entities/SocialAccount';

export interface LinkedAccount {
  socialAccountId: string;
  provider: SocialProvider;
  providerEmail?: string;
  displayName?: string;
  avatarUrl?: string;
  isPrimary: boolean;
  lastUsedAt?: Date;
}

// ============================================================================
// Use Cases
// ============================================================================


export class GetLinkedAccountsUseCase {
  constructor(private readonly socialAccountRepo: SocialAccountRepository) {}

  /**
   * Get all linked social accounts for a user
   */
  async execute(userId: string, userType: UserType): Promise<LinkedAccount[]> {
    const accounts = await this.socialAccountRepo.findByUserId(userId, userType);

    return accounts
      .filter(account => account.isActive)
      .map(account => ({
        socialAccountId: account.socialAccountId,
        provider: account.provider,
        providerEmail: account.providerEmail,
        displayName: account.displayName,
        avatarUrl: account.avatarUrl,
        isPrimary: account.isPrimary,
        lastUsedAt: account.lastUsedAt,
      }));
  }
}
