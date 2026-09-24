import { createActiveUser, createLockedUser, createMockUserRepo } from '../../tests/testUtils';
import { LoginUseCase, LoginCommand } from './Login';
import { User } from '../../domain/entities/User';
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountNotActiveError,
} from '../../domain/errors/IdentityErrors';

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

    await expect(useCase.execute(new LoginCommand('wrong@example.com', 'wrongpass'))).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw AccountLockedError when user is locked', async () => {
    const user = createLockedUser();
    const repo = createMockUserRepo(user);
    const useCase = new LoginUseCase(repo);

    await expect(useCase.execute(new LoginCommand('test@example.com', 'password'))).rejects.toThrow(AccountLockedError);
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

    await expect(useCase.execute(new LoginCommand('inactive@example.com', 'password'))).rejects.toThrow(AccountNotActiveError);
  });
});

