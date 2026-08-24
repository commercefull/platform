/**
 * Unit Tests for SocialLogin Use Cases
 * Covers SocialLogin, LinkSocialAccount, UnlinkSocialAccount, GetLinkedAccounts.
 */

import {
  SocialLoginUseCase,
  LinkSocialAccountUseCase,
  UnlinkSocialAccountUseCase,
  GetLinkedAccountsUseCase,
} from './SocialLogin';
import {
  SocialAccount,
  SocialProvider,
  UserType,
  SocialProfileData,
  SocialAccountProps,
} from '../../domain/entities/SocialAccount';
import {
  EmailRequiredError,
  SocialAccountAlreadyLinkedError,
  SocialAccountNotLinkedError,
  CannotUnlinkOnlyLoginMethodError,
} from '../../domain/errors/IdentityErrors';

import type { SocialAccountRepo } from '../../infrastructure/repositories/socialAccountRepo';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

// ============================================================================
// Helpers
// ============================================================================

function createSocialAccountProps(overrides: Partial<SocialAccountProps> = {}): SocialAccountProps {
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

function createSocialProfileData(overrides: Partial<SocialProfileData> = {}): SocialProfileData {
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

function createMockSocialAccountRepo(
  account: SocialAccount | null = null,
  accounts: SocialAccount[] = [],
  linkedCount = 1,
): jest.Mocked<SocialAccountRepo> {
  return {
    findByProviderUserId: jest.fn().mockResolvedValue(account),
    findByUserAndProvider: jest.fn().mockResolvedValue(account),
    findByUserId: jest.fn().mockResolvedValue(accounts),
    create: jest.fn().mockResolvedValue(SocialAccount.create(createSocialAccountProps())),
    updateTokens: jest.fn().mockResolvedValue(undefined),
    recordLogin: jest.fn().mockResolvedValue(undefined),
    deactivate: jest.fn().mockResolvedValue(undefined),
    getLinkedProviderCount: jest.fn().mockResolvedValue(linkedCount),
  } as never as jest.Mocked<SocialAccountRepo>;
}

// ============================================================================
// SocialLoginUseCase
// ============================================================================

describe('SocialLoginUseCase', () => {
  it('should login with existing social account', async () => {
    const account = SocialAccount.create(createSocialAccountProps());
    const repo = createMockSocialAccountRepo(account);
    const findOrCreateUser = jest.fn();
    const useCase = new SocialLoginUseCase(repo, findOrCreateUser);

    const result = await useCase.execute({
      provider: 'google',
      profile: createSocialProfileData(),
      userType: 'customer',
      ip: '127.0.0.1',
    });

    expect(result.isNewUser).toBe(false);
    expect(result.userId).toBe('u-1');
    expect(result.provider).toBe('google');
    expect(result.socialAccountId).toBe('sa-1');
    expect(repo.updateTokens).toHaveBeenCalled();
    expect(repo.recordLogin).toHaveBeenCalled();
    expect(findOrCreateUser).not.toHaveBeenCalled();
  });

  it('should create new user when social account does not exist', async () => {
    const repo = createMockSocialAccountRepo(null);
    const findOrCreateUser = jest.fn().mockResolvedValue({ userId: 'u-new', isNew: true });
    const useCase = new SocialLoginUseCase(repo, findOrCreateUser);

    const result = await useCase.execute({
      provider: 'google',
      profile: createSocialProfileData(),
      userType: 'customer',
    });

    expect(result.isNewUser).toBe(true);
    expect(result.userId).toBe('u-new');
    expect(repo.create).toHaveBeenCalled();
    expect(findOrCreateUser).toHaveBeenCalled();
  });

  it('should throw EmailRequiredError when profile has no email and no existing account', async () => {
    const repo = createMockSocialAccountRepo(null);
    const findOrCreateUser = jest.fn();
    const useCase = new SocialLoginUseCase(repo, findOrCreateUser);

    await expect(
      useCase.execute({
        provider: 'google',
        profile: createSocialProfileData({ email: undefined }),
        userType: 'customer',
      }),
    ).rejects.toThrow(EmailRequiredError);
  });
});

// ============================================================================
// LinkSocialAccountUseCase
// ============================================================================

describe('LinkSocialAccountUseCase', () => {
  it('should throw SocialAccountAlreadyLinkedError when provider is linked to another user', async () => {
    const existingAccount = SocialAccount.create(createSocialAccountProps({ userId: 'other-user' }));
    const repo = createMockSocialAccountRepo(existingAccount);
    const useCase = new LinkSocialAccountUseCase(repo);

    await expect(
      useCase.execute({
        userId: 'u-1',
        userType: 'customer',
        provider: 'google',
        profile: createSocialProfileData(),
      }),
    ).rejects.toThrow(SocialAccountAlreadyLinkedError);
  });

  it('should update tokens when provider is already linked to same user', async () => {
    const existingAccount = SocialAccount.create(createSocialAccountProps({ userId: 'u-1' }));
    const repo = createMockSocialAccountRepo(existingAccount);
    const useCase = new LinkSocialAccountUseCase(repo);

    const result = await useCase.execute({
      userId: 'u-1',
      userType: 'customer',
      provider: 'google',
      profile: createSocialProfileData({ accessToken: 'new-token' }),
    });

    expect(result.socialAccountId).toBe('sa-1');
    expect(repo.updateTokens).toHaveBeenCalledWith('sa-1', 'new-token', 'refresh-token', expect.any(Date));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should create new link when no existing link found', async () => {
    const repo = createMockSocialAccountRepo(null);
    const useCase = new LinkSocialAccountUseCase(repo);

    const result = await useCase.execute({
      userId: 'u-1',
      userType: 'customer',
      provider: 'google',
      profile: createSocialProfileData(),
    });

    expect(result.socialAccountId).toBe('sa-1');
    expect(result.isPrimary).toBe(false);
    expect(repo.create).toHaveBeenCalled();
  });
});

// ============================================================================
// UnlinkSocialAccountUseCase
// ============================================================================

describe('UnlinkSocialAccountUseCase', () => {
  it('should unlink social account successfully', async () => {
    const account = SocialAccount.create(createSocialAccountProps());
    const repo = createMockSocialAccountRepo(account, [], 2);
    const useCase = new UnlinkSocialAccountUseCase(repo);

    await useCase.execute({
      userId: 'u-1',
      userType: 'customer',
      provider: 'google',
    });

    expect(repo.deactivate).toHaveBeenCalledWith('sa-1');
  });

  it('should throw SocialAccountNotLinkedError when no linked account found', async () => {
    const repo = createMockSocialAccountRepo(null);
    const useCase = new UnlinkSocialAccountUseCase(repo);

    await expect(
      useCase.execute({
        userId: 'u-1',
        userType: 'customer',
        provider: 'google',
      }),
    ).rejects.toThrow(SocialAccountNotLinkedError);
  });

  it('should throw CannotUnlinkOnlyLoginMethodError when only one linked account', async () => {
    const account = SocialAccount.create(createSocialAccountProps());
    const repo = createMockSocialAccountRepo(account, [], 1);
    const useCase = new UnlinkSocialAccountUseCase(repo);

    await expect(
      useCase.execute({
        userId: 'u-1',
        userType: 'customer',
        provider: 'google',
      }),
    ).rejects.toThrow(CannotUnlinkOnlyLoginMethodError);
  });
});

// ============================================================================
// GetLinkedAccountsUseCase
// ============================================================================

describe('GetLinkedAccountsUseCase', () => {
  it('should return only active linked accounts', async () => {
    const activeAccount = SocialAccount.create(createSocialAccountProps({ isActive: true, socialAccountId: 'sa-1' }));
    const inactiveAccount = SocialAccount.create(createSocialAccountProps({ isActive: false, socialAccountId: 'sa-2' }));
    const repo = createMockSocialAccountRepo(null, [activeAccount, inactiveAccount]);
    const useCase = new GetLinkedAccountsUseCase(repo);

    const result = await useCase.execute('u-1', 'customer');

    expect(result).toHaveLength(1);
    expect(result[0].socialAccountId).toBe('sa-1');
  });

  it('should return empty array when no accounts found', async () => {
    const repo = createMockSocialAccountRepo(null, []);
    const useCase = new GetLinkedAccountsUseCase(repo);

    const result = await useCase.execute('u-1', 'customer');

    expect(result).toEqual([]);
  });
});
