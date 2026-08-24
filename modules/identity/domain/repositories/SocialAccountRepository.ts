/**
 * Social Account Repository Port
 *
 * Domain interface for OAuth/social login account management.
 */

import { SocialAccount, SocialProvider, UserType } from '../entities/SocialAccount';

export interface CreateSocialAccountInput {
  userId: string;
  userType: UserType;
  provider: SocialProvider;
  providerUserId: string;
  providerEmail?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  profileUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
  providerData?: Record<string, unknown>;
}

export interface SocialAccountRepository {
  findByProviderUserId(provider: SocialProvider, providerUserId: string): Promise<SocialAccount | null>;
  findByUserAndProvider(userId: string, userType: UserType, provider: SocialProvider): Promise<SocialAccount | null>;
  findByUserId(userId: string, userType: UserType): Promise<SocialAccount[]>;
  create(params: CreateSocialAccountInput): Promise<SocialAccount>;
  updateLastUsed(socialAccountId: string, ip?: string): Promise<void>;
  deactivate(socialAccountId: string): Promise<void>;
  countActiveByUser(userId: string, userType: UserType): Promise<number>;
}
