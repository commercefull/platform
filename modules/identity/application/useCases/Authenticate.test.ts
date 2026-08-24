/**
 * Unit Tests for Authenticate Use Cases
 * Covers Login, RefreshToken, and Logout.
 */

import { LoginUseCase, LoginCommand, RefreshTokenUseCase, RefreshTokenCommand, LogoutUseCase, LogoutCommand } from './Authenticate';
import { User } from '../../domain/entities/User';
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountNotActiveError,
  InvalidRefreshTokenError,
} from '../../domain/errors/IdentityErrors';

import type { UserRepository } from '../../domain/repositories/UserRepository';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).slice(2, 8)),
}));

function createActiveUser(): User {
  const user = User.create({
    userId: 'u-1',
    email: 'test@example.com',
    passwordHash: 'hashed-pw',
    userType: 'customer',
  });
  user.verifyEmail();
  return user;
}

function createLockedUser(): User {
  const user = createActiveUser();
  for (let i = 0; i < 5; i++) {
    user.recordFailedLogin();
  }
  return user;
}

function createMockUserRepo(user: User | null): jest.Mocked<UserRepository> {
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

describe('LoginUseCase', () => {
  it('should login successfully with valid credentials', async () => {
    const user = createActiveUser();
    const repo = createMockUserRepo(user);
    const useCase = new LoginUseCase(repo);

    const result = await useCase.execute(new LoginCommand('test@example.com', 'password', '127.0.0.1'));

    expect(result.userId).toBe('u-1');
    expect(result.email).toBe('test@example.com');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.expiresIn).toBe(3600);
    expect(repo.validateCredentials).toHaveBeenCalledWith('test@example.com', 'password');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw InvalidCredentialsError when credentials are invalid', async () => {
    const repo = createMockUserRepo(null);
    repo.validateCredentials = jest.fn().mockResolvedValue(null);
    const useCase = new LoginUseCase(repo);

    await expect(
      useCase.execute(new LoginCommand('wrong@example.com', 'wrongpass')),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw AccountLockedError when user is locked', async () => {
    const user = createLockedUser();
    const repo = createMockUserRepo(user);
    const useCase = new LoginUseCase(repo);

    await expect(
      useCase.execute(new LoginCommand('test@example.com', 'password')),
    ).rejects.toThrow(AccountLockedError);
  });

  it('should throw AccountNotActiveError when user is not active', async () => {
    const user = User.create({
      userId: 'u-2',
      email: 'inactive@example.com',
      passwordHash: 'hashed-pw',
      userType: 'customer',
    });
    const repo = createMockUserRepo(user);
    const useCase = new LoginUseCase(repo);

    await expect(
      useCase.execute(new LoginCommand('inactive@example.com', 'password')),
    ).rejects.toThrow(AccountNotActiveError);
  });
});

describe('RefreshTokenUseCase', () => {
  it('should refresh token successfully', async () => {
    const user = createActiveUser();
    const repo = createMockUserRepo(user);
    const useCase = new RefreshTokenUseCase(repo);

    const result = await useCase.execute(new RefreshTokenCommand('valid-refresh-token'));

    expect(result.userId).toBe('u-1');
    expect(result.email).toBe('test@example.com');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(repo.findByRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw InvalidRefreshTokenError when token is invalid', async () => {
    const repo = createMockUserRepo(null);
    repo.findByRefreshToken = jest.fn().mockResolvedValue(null);
    const useCase = new RefreshTokenUseCase(repo);

    await expect(
      useCase.execute(new RefreshTokenCommand('invalid-token')),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('should throw InvalidRefreshTokenError when user cannot login', async () => {
    const user = User.create({
      userId: 'u-3',
      email: 'pending@example.com',
      passwordHash: 'hashed-pw',
      userType: 'customer',
    });
    const repo = createMockUserRepo(user);
    const useCase = new RefreshTokenUseCase(repo);

    await expect(
      useCase.execute(new RefreshTokenCommand('some-token')),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });
});

describe('LogoutUseCase', () => {
  it('should logout successfully by clearing refresh token', async () => {
    const user = createActiveUser();
    user.setRefreshToken('some-token', new Date(Date.now() + 86400000));
    const repo = createMockUserRepo(user);
    const useCase = new LogoutUseCase(repo);

    await useCase.execute(new LogoutCommand('u-1'));

    expect(repo.findById).toHaveBeenCalledWith('u-1');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should do nothing when user does not exist', async () => {
    const repo = createMockUserRepo(null);
    const useCase = new LogoutUseCase(repo);

    await useCase.execute(new LogoutCommand('nonexistent'));

    expect(repo.save).not.toHaveBeenCalled();
  });
});
