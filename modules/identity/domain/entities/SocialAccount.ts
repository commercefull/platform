/**
 * Social Account Entity
 *
 * Represents a linked OAuth/social login provider account.
 */

// ============================================================================
// Types
// ============================================================================

export type SocialProvider = 'google' | 'facebook' | 'apple' | 'github' | 'twitter' | 'linkedin' | 'microsoft';

export type UserType = 'customer' | 'merchant';

export interface SocialAccountProps {
  socialAccountId: string;
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
  isActive: boolean;
  isPrimary: boolean;
  providerData?: Record<string, any>;
  lastUsedAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialProfileData {
  providerUserId: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  profileUrl?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
  rawData?: Record<string, any>;
}

// ============================================================================
// Entity
// ============================================================================

export class SocialAccount {
  private props: SocialAccountProps;

  private constructor(props: SocialAccountProps) {
    this.props = props;
  }

  // Factory methods
  static create(props: SocialAccountProps): SocialAccount {
    return new SocialAccount(props);
  }

  static createNew(userId: string, userType: UserType, provider: SocialProvider, profile: SocialProfileData): SocialAccount {
    const now = new Date();
    return new SocialAccount({
      socialAccountId: '', // Will be set by repository
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
      isActive: true,
      isPrimary: false,
      providerData: profile.rawData,
      lastUsedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Getters
  get socialAccountId(): string {
    return this.props.socialAccountId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get userType(): UserType {
    return this.props.userType;
  }
  get provider(): SocialProvider {
    return this.props.provider;
  }
  get providerUserId(): string {
    return this.props.providerUserId;
  }
  get providerEmail(): string | undefined {
    return this.props.providerEmail;
  }
  get displayName(): string | undefined {
    return this.props.displayName;
  }
  get firstName(): string | undefined {
    return this.props.firstName;
  }
  get lastName(): string | undefined {
    return this.props.lastName;
  }
  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }
  get profileUrl(): string | undefined {
    return this.props.profileUrl;
  }
  get accessToken(): string | undefined {
    return this.props.accessToken;
  }
  get refreshToken(): string | undefined {
    return this.props.refreshToken;
  }
  get tokenExpiresAt(): Date | undefined {
    return this.props.tokenExpiresAt;
  }
  get scopes(): string[] | undefined {
    return this.props.scopes;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get isPrimary(): boolean {
    return this.props.isPrimary;
  }
  get providerData(): Record<string, any> | undefined {
    return this.props.providerData;
  }
  get lastUsedAt(): Date | undefined {
    return this.props.lastUsedAt;
  }
  get lastLoginIp(): string | undefined {
    return this.props.lastLoginIp;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  updateTokens(accessToken: string, refreshToken?: string, expiresAt?: Date): void {
    this.props.accessToken = accessToken;
    if (refreshToken) {
      this.props.refreshToken = refreshToken;
    }
    if (expiresAt) {
      this.props.tokenExpiresAt = expiresAt;
    }
    this.props.updatedAt = new Date();
  }

  updateProfile(profile: Partial<SocialProfileData>): void {
    if (profile.displayName !== undefined) this.props.displayName = profile.displayName;
    if (profile.firstName !== undefined) this.props.firstName = profile.firstName;
    if (profile.lastName !== undefined) this.props.lastName = profile.lastName;
    if (profile.avatarUrl !== undefined) this.props.avatarUrl = profile.avatarUrl;
    if (profile.profileUrl !== undefined) this.props.profileUrl = profile.profileUrl;
    if (profile.email !== undefined) this.props.providerEmail = profile.email;
    this.props.updatedAt = new Date();
  }

  recordLogin(ip?: string): void {
    this.props.lastUsedAt = new Date();
    if (ip) {
      this.props.lastLoginIp = ip;
    }
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  setPrimary(isPrimary: boolean): void {
    this.props.isPrimary = isPrimary;
    this.props.updatedAt = new Date();
  }

  isTokenExpired(): boolean {
    if (!this.props.tokenExpiresAt) return false;
    return new Date() > this.props.tokenExpiresAt;
  }

  hasScope(scope: string): boolean {
    return this.props.scopes?.includes(scope) ?? false;
  }

  toJSON(): SocialAccountProps {
    return { ...this.props };
  }
}
