import { createActiveUser, createMockUserRepo } from '../../tests/testUtils';
import { RefreshTokenUseCase, RefreshTokenCommand } from './RefreshToken';
import { User } from '../../domain/entities/User';
import { InvalidRefreshTokenError } from '../../domain/errors/IdentityErrors';

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

    await expect(useCase.execute(new RefreshTokenCommand('invalid-token'))).rejects.toThrow(InvalidRefreshTokenError);
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

    await expect(useCase.execute(new RefreshTokenCommand('some-token'))).rejects.toThrow(InvalidRefreshTokenError);
  });
});

