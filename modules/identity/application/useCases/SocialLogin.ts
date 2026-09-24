/**
 * Social Login Use Case
 *
 * Handles OAuth/social login authentication flows.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import type { SocialAccountRepository } from '../../domain/repositories/SocialAccountRepository';
import { SocialProvider, UserType, SocialProfileData } from '../../domain/entities/SocialAccount';
import { EmailRequiredError } from '../../domain/errors/IdentityErrors';

export interface SocialLoginCommand {
  provider: SocialProvider;
  profile: SocialProfileData;
  userType: UserType;
  ip?: string;
}


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


export class SocialLoginUseCase {
  constructor(
    private readonly socialAccountRepo: SocialAccountRepository,
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
        throw new EmailRequiredError();
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

