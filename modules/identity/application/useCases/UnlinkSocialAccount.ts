import type { SocialAccountRepository } from '../../domain/repositories/SocialAccountRepository';
import { SocialProvider, UserType } from '../../domain/entities/SocialAccount';
import {
  SocialAccountNotLinkedError,
  CannotUnlinkOnlyLoginMethodError,
} from '../../domain/errors/IdentityErrors';

export interface UnlinkSocialAccountCommand {
  userId: string;
  userType: UserType;
  provider: SocialProvider;
}

// ============================================================================
// Response Types
// ============================================================================


export class UnlinkSocialAccountUseCase {
  constructor(private readonly socialAccountRepo: SocialAccountRepository) {}

  /**
   * Unlink a social account from a user
   */
  async execute(command: UnlinkSocialAccountCommand): Promise<void> {
    const { userId, userType, provider } = command;

    // Find the social account
    const socialAccount = await this.socialAccountRepo.findByUserAndProvider(userId, userType, provider);

    if (!socialAccount) {
      throw new SocialAccountNotLinkedError(provider);
    }

    // Check if this is the only login method
    const linkedCount = await this.socialAccountRepo.getLinkedProviderCount(userId, userType);

    // Note: In a real implementation, you'd also check if the user has a password set
    // For now, we'll allow unlinking as long as there's at least one other social account
    if (linkedCount <= 1) {
      throw new CannotUnlinkOnlyLoginMethodError();
    }

    // Deactivate the social account
    await this.socialAccountRepo.deactivate(socialAccount.socialAccountId);
  }
}

