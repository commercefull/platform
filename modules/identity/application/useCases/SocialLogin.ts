/**
 * Social Login Use Cases
 *
 * Handles OAuth/social login authentication flows.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { SocialAccountRepo, CreateSocialAccountInput } from '../../repos/socialAccountRepo';
import { SocialProvider, UserType, SocialProfileData } from '../../domain/entities/SocialAccount';

// ============================================================================
// Commands
// ============================================================================

export interface SocialLoginCommand {
  provider: SocialProvider;
  profile: SocialProfileData;
  userType: UserType;
  ip?: string;
}

export interface LinkSocialAccountCommand {
  userId: string;
  userType: UserType;
  provider: SocialProvider;
  profile: SocialProfileData;
}

export interface UnlinkSocialAccountCommand {
  userId: string;
  userType: UserType;
  provider: SocialProvider;
}

// ============================================================================
// Response Types
// ============================================================================

export interface SocialLoginResult {
  isNewUser: boolean;
  userId: string;
  email: string;
  userType: UserType;
  provider: SocialProvider;
  socialAccountId: string;
  profile: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

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

export class SocialLoginUseCase {
  constructor(
    private readonly socialAccountRepo: SocialAccountRepo,
    private readonly findOrCreateUser: (
      email: string,
      profile: SocialProfileData,
      userType: UserType,
    ) => Promise<{ userId: string; isNew: boolean }>,
  ) {}

  /**
   * Authenticate or register a user via social login
   */
  async execute(command: SocialLoginCommand): Promise<SocialLoginResult> {
    const { provider, profile, userType, ip } = command;

    // Check if this social account is already linked
    let socialAccount = await this.socialAccountRepo.findByProviderUserId(provider, profile.providerUserId);

    let userId: string;
    let isNewUser = false;

    if (socialAccount) {
      // Existing social account - update tokens and record login
      userId = socialAccount.userId;

      await this.socialAccountRepo.updateTokens(
        socialAccount.socialAccountId,
        profile.accessToken,
        profile.refreshToken,
        profile.tokenExpiresAt,
      );

      await this.socialAccountRepo.recordLogin(socialAccount.socialAccountId, ip);
    } else {
      // New social login - find or create user
      const email = profile.email;
      if (!email) {
        throw new Error('Email is required for social login');
      }

      const userResult = await this.findOrCreateUser(email, profile, userType);
      userId = userResult.userId;
      isNewUser = userResult.isNew;

      // Create social account link
      socialAccount = await this.socialAccountRepo.create({
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
        lastLoginIp: ip,
      });

      // Emit event
      eventBus.emit('identity.customer.login', {
        customerId: userId,
        email: profile.email,
        provider,
        isSocialLogin: true,
        isNewUser,
        ipAddress: ip,
        timestamp: new Date(),
      });
    }

    return {
      isNewUser,
      userId,
      email: profile.email || socialAccount.providerEmail || '',
      userType,
      provider,
      socialAccountId: socialAccount.socialAccountId,
      profile: {
        displayName: profile.displayName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
      },
    };
  }
}

export class LinkSocialAccountUseCase {
  constructor(private readonly socialAccountRepo: SocialAccountRepo) {}

  /**
   * Link a social account to an existing user
   */
  async execute(command: LinkSocialAccountCommand): Promise<LinkedAccount> {
    const { userId, userType, provider, profile } = command;

    // Check if this provider is already linked to another user
    const existing = await this.socialAccountRepo.findByProviderUserId(provider, profile.providerUserId);

    if (existing && existing.userId !== userId) {
      throw new Error(`This ${provider} account is already linked to another user`);
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

export class UnlinkSocialAccountUseCase {
  constructor(private readonly socialAccountRepo: SocialAccountRepo) {}

  /**
   * Unlink a social account from a user
   */
  async execute(command: UnlinkSocialAccountCommand): Promise<void> {
    const { userId, userType, provider } = command;

    // Find the social account
    const socialAccount = await this.socialAccountRepo.findByUserAndProvider(userId, userType, provider);

    if (!socialAccount) {
      throw new Error(`No ${provider} account linked to this user`);
    }

    // Check if this is the only login method
    const linkedCount = await this.socialAccountRepo.getLinkedProviderCount(userId, userType);

    // Note: In a real implementation, you'd also check if the user has a password set
    // For now, we'll allow unlinking as long as there's at least one other social account
    if (linkedCount <= 1) {
      throw new Error('Cannot unlink the only login method. Please add another login method first.');
    }

    // Deactivate the social account
    await this.socialAccountRepo.deactivate(socialAccount.socialAccountId);
  }
}

export class GetLinkedAccountsUseCase {
  constructor(private readonly socialAccountRepo: SocialAccountRepo) {}

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
