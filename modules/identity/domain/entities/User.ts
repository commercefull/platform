/**
 * User Entity (Identity)
 */

export type UserType = 'customer' | 'merchant' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface UserProps {
  userId: string;
  email: string;
  passwordHash: string;
  userType: UserType;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginCount: number;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
  }

  static create(props: {
    userId: string;
    email: string;
    passwordHash: string;
    userType: UserType;
    firstName?: string;
    lastName?: string;
    phone?: string;
    metadata?: Record<string, any>;
  }): User {
    const now = new Date();
    return new User({
      userId: props.userId,
      email: props.email.toLowerCase().trim(),
      passwordHash: props.passwordHash,
      userType: props.userType,
      status: 'pending_verification',
      firstName: props.firstName,
      lastName: props.lastName,
      phone: props.phone,
      emailVerified: false,
      phoneVerified: false,
      mfaEnabled: false,
      loginCount: 0,
      failedLoginAttempts: 0,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters
  get userId(): string {
    return this.props.userId;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get userType(): UserType {
    return this.props.userType;
  }
  get status(): UserStatus {
    return this.props.status;
  }
  get firstName(): string | undefined {
    return this.props.firstName;
  }
  get lastName(): string | undefined {
    return this.props.lastName;
  }
  get emailVerified(): boolean {
    return this.props.emailVerified;
  }
  get mfaEnabled(): boolean {
    return this.props.mfaEnabled;
  }
  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }
  get loginCount(): number {
    return this.props.loginCount;
  }
  get refreshToken(): string | undefined {
    return this.props.refreshToken;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed
  get fullName(): string {
    return `${this.props.firstName || ''} ${this.props.lastName || ''}`.trim();
  }
  get isActive(): boolean {
    return this.props.status === 'active';
  }
  get isLocked(): boolean {
    return this.props.lockedUntil ? this.props.lockedUntil > new Date() : false;
  }
  get canLogin(): boolean {
    return this.isActive && !this.isLocked;
  }

  // Domain methods
  verifyEmail(): void {
    this.props.emailVerified = true;
    if (this.props.status === 'pending_verification') {
      this.props.status = 'active';
    }
    this.touch();
  }

  recordLogin(ip?: string): void {
    this.props.lastLoginAt = new Date();
    this.props.lastLoginIp = ip;
    this.props.loginCount += 1;
    this.props.failedLoginAttempts = 0;
    this.touch();
  }

  recordFailedLogin(): void {
    this.props.failedLoginAttempts += 1;
    if (this.props.failedLoginAttempts >= 5) {
      this.props.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    this.touch();
  }

  updatePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
    this.touch();
  }

  setRefreshToken(token: string, expiresAt: Date): void {
    this.props.refreshToken = token;
    this.props.refreshTokenExpiresAt = expiresAt;
    this.touch();
  }

  clearRefreshToken(): void {
    this.props.refreshToken = undefined;
    this.props.refreshTokenExpiresAt = undefined;
    this.touch();
  }

  enableMfa(secret: string): void {
    this.props.mfaEnabled = true;
    this.props.mfaSecret = secret;
    this.touch();
  }

  disableMfa(): void {
    this.props.mfaEnabled = false;
    this.props.mfaSecret = undefined;
    this.touch();
  }

  activate(): void {
    this.props.status = 'active';
    this.touch();
  }

  suspend(): void {
    this.props.status = 'suspended';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      userId: this.props.userId,
      email: this.props.email,
      userType: this.props.userType,
      status: this.props.status,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      fullName: this.fullName,
      emailVerified: this.props.emailVerified,
      phoneVerified: this.props.phoneVerified,
      mfaEnabled: this.props.mfaEnabled,
      isActive: this.isActive,
      canLogin: this.canLogin,
      lastLoginAt: this.props.lastLoginAt?.toISOString(),
      loginCount: this.props.loginCount,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
