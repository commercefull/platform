import type { SocialAccountRepository } from '../../domain/repositories/SocialAccountRepository';
import { SocialProvider, UserType, SocialProfileData } from '../../domain/entities/SocialAccount';
import type { LinkedAccount } from './GetLinkedAccounts';
import { SocialAccountAlreadyLinkedError } from '../../domain/errors/IdentityErrors';

export interface LinkSocialAccountCommand {
  userId: string;
  userType: UserType;
  provider: SocialProvider;
  profile: SocialProfileData;
}


export class LinkSocialAccountUseCase {
  constructor(private readonly socialAccountRepo: SocialAccountRepository) {}

  /**
   * Link a social account to an existing user
   */
  async execute(command: LinkSocialAccountCommand): Promise<LinkedAccount> {
    const { userId, userType, provider, profile } = command;

    // Check if this provider is already linked to another user
    const existing = await this.socialAccountRepo.findByProviderUserId(provider, profile.providerUserId);

    if (existing && existing.userId !== userId) {
      throw new SocialAccountAlreadyLinkedError(provider);
    }

    // Check if user already has this provider linked
    const userExisting = await this.socialAccountRepo.findByUserAndProvider(userId, userType, provider);

    if (userExisting) {
      // Update existing link
      await this.socialAccountRepo.updateTokens(
        userExisting.socialAccountId,
        profile.accessToken,
        profile.refreshToken,
        profile.tokenExpiresAt,
      );

      return {
        socialAccountId: userExisting.socialAccountId,
        provider,
        providerEmail: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        isPrimary: userExisting.isPrimary,
        lastUsedAt: new Date(),
      };
    }

    // Create new link
    const socialAccount = await this.socialAccountRepo.create({
      userId,
      userType,
      provider,
      providerUserId: profile.providerUserId,
      providerEmail: profile.email,
      displayName: profile.displayName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      tokenExpiresAt: profile.tokenExpiresAt,
      scopes: profile.scopes,
      providerData: profile.rawData,
    });

    return {
      socialAccountId: socialAccount.socialAccountId,
      provider,
      providerEmail: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      isPrimary: false,
      lastUsedAt: new Date(),
    };
  }
}

