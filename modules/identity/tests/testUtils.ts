/**
 * Shared test utilities for identity use-case tests.
 * Mocks module boundaries (eventBus, uuid, logger) once and provides
 * typed repository/port factories plus record factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import type { AdminUser, AdminUserRecord, RoleRecord } from '../domain/repositories/AdminIdentityPorts';
import { User } from '../domain/entities/User';
import { UserStoreAssignment } from '../domain/entities/UserStoreAssignment';
import type { UserRepository } from '../domain/repositories/UserRepository';
import { SamlProvider } from '../domain/entities/SamlProvider';
import { SocialAccount } from '../domain/entities/SocialAccount';
import type { SocialAccountProps, SocialProfileData, SocialProvider, UserType } from '../domain/entities/SocialAccount';
import type { SocialAccountRepository } from '../domain/repositories/SocialAccountRepository';
import { OidcProvider } from '../domain/entities/OidcProvider';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'identity-uuid-123'),
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

// ============================================================================
// Record factories
// ============================================================================

export function createAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    adminId: 'admin-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    passwordHash: 'hash',
    role: 'admin',
    permissions: [],
    status: 'active',
    lastLoginAt: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createAdminUserRecord(overrides: Partial<AdminUserRecord> = {}): AdminUserRecord {
  return {
    adminId: 'admin-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    passwordHash: 'hash',
    role: 'admin',
    permissions: [],
    status: 'active',
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}

export function createRoleRecord(overrides: Partial<RoleRecord> = {}): RoleRecord {
  return {
    roleId: 'role-1',
    name: 'Admin',
    description: null,
    permissions: ['read'],
    isSystem: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createCredentialSubject(
  overrides: Partial<{ id: string; email: string; name: string; status: string; isActive: boolean; isVerified: boolean }> = {},
) {
  return {
    id: 'subject-1',
    email: 'subject@test.com',
    name: 'Test Subject',
    status: 'active',
    isActive: true,
    isVerified: true,
    ...overrides,
  };
}

export function createRefreshTokenInfo(
  overrides: Partial<{ token: string; userType: string; userId: string; isRevoked: boolean; expiresAt: Date }> = {},
) {
  return {
    token: 'refresh-token-1',
    userType: 'customer',
    userId: 'subject-1',
    isRevoked: false,
    expiresAt: new Date('2099-01-01'),
    ...overrides,
  };
}

export function createUserStoreAssignment(
  overrides: Partial<{ userStoreId: string; userId: string; storeId: string; isPrimary: boolean; role: 'cashier' | 'manager' | 'admin' }> = {},
) {
  return UserStoreAssignment.create({
    userStoreId: overrides.userStoreId ?? 'us-1',
    userId: overrides.userId ?? 'user-1',
    storeId: overrides.storeId ?? 'store-1',
    role: overrides.role ?? 'admin',
    isPrimary: overrides.isPrimary ?? false,
  });
}

export function createSamlProvider(overrides: Partial<Parameters<typeof SamlProvider.create>[0]> = {}): SamlProvider {
  return SamlProvider.create({
    providerId: 'saml-1', organizationId: 'org-1', name: 'Okta',
    entityId: 'idp-entity', ssoUrl: 'https://idp.test/sso', certificate: 'CERT',
    spEntityId: 'sp-entity', acsUrl: 'https://app.test/acs',
    ...overrides,
  });
}

export function createOidcProvider(overrides: Partial<Parameters<typeof OidcProvider.create>[0]> = {}): OidcProvider {
  return OidcProvider.create({
    providerId: 'oidc-1', organizationId: 'org-1', name: 'Auth0',
    issuerUrl: 'https://idp.test', clientId: 'client-1', clientSecret: 'secret',
    redirectUri: 'https://app.test/callback', usePkce: true,
    authorizationEndpoint: 'https://idp.test/authorize',
    ...overrides,
  });
}

export function createSocialAccountProps(overrides: Partial<SocialAccountProps> = {}): SocialAccountProps {
  return {
    socialAccountId: 'sa-1',
    userId: 'u-1',
    userType: 'customer' as UserType,
    provider: 'google' as SocialProvider,
    providerUserId: 'google-123',
    providerEmail: 'test@example.com',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: 'https://avatar.url/test.png',
    profileUrl: 'https://profile.url/test',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenExpiresAt: new Date(Date.now() + 3600_000),
    scopes: ['email', 'profile'],
    isActive: true,
    isPrimary: false,
    providerData: {},
    lastUsedAt: new Date(),
    lastLoginIp: '127.0.0.1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createSocialProfileData(overrides: Partial<SocialProfileData> = {}): SocialProfileData {
  return {
    providerUserId: 'google-123',
    email: 'test@example.com',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: 'https://avatar.url/test.png',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenExpiresAt: new Date(Date.now() + 3600_000),
    scopes: ['email', 'profile'],
    ...overrides,
  };
}

export function createMockSocialAccountRepo(
  account: SocialAccount | null = null,
  accounts: SocialAccount[] = [],
  linkedCount = 1,
): jest.Mocked<SocialAccountRepository> {
  return {
    findByProviderUserId: jest.fn().mockResolvedValue(account),
    findByUserAndProvider: jest.fn().mockResolvedValue(account),
    findByUserId: jest.fn().mockResolvedValue(accounts),
    create: jest.fn().mockResolvedValue(SocialAccount.create(createSocialAccountProps())),
    updateTokens: jest.fn().mockResolvedValue(undefined),
    recordLogin: jest.fn().mockResolvedValue(undefined),
    deactivate: jest.fn().mockResolvedValue(undefined),
    getLinkedProviderCount: jest.fn().mockResolvedValue(linkedCount),
  } as jest.Mocked<SocialAccountRepository>;
}

export function createActiveUser(): User {
  const user = User.create({
    userId: 'u-1',
    email: 'test@example.com',
    passwordHash: 'hashed-pw',
    userType: 'customer',
  });
  user.verifyEmail();
  return user;
}

export function createLockedUser(): User {
  const user = createActiveUser();
  for (let i = 0; i < 5; i++) {
    user.recordFailedLogin();
  }
  return user;
}

export function createMockUserRepo(user: User | null): jest.Mocked<UserRepository> {
  return {
    findById: jest.fn().mockResolvedValue(user),
    findByEmail: jest.fn().mockResolvedValue(user),
    findByRefreshToken: jest.fn().mockResolvedValue(user),
    findAll: jest.fn().mockResolvedValue({ data: user ? [user] : [], total: user ? 1 : 0 }),
    save: jest.fn().mockResolvedValue(user),
    delete: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(1),
    validateCredentials: jest.fn().mockResolvedValue(user),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
    createPasswordResetToken: jest.fn().mockResolvedValue('reset-token'),
    validatePasswordResetToken: jest.fn().mockResolvedValue(user),
    createEmailVerificationToken: jest.fn().mockResolvedValue('verify-token'),
    validateEmailVerificationToken: jest.fn().mockResolvedValue(user),
  } as never as jest.Mocked<UserRepository>;
}
