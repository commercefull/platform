import { lazyMock } from '../../../tests/testUtils';
import { CleanupExpiredTokensUseCase } from './CleanupExpiredTokens';
import type { TokenRepository } from '../../../domain/repositories/TokenRepository';

describe('CleanupExpiredTokensUseCase', () => {
  it('should clean up expired refresh tokens and blacklist entries', async () => {
    const tokenRepo = lazyMock<TokenRepository>();
    tokenRepo.cleanupExpiredRefreshTokens.mockResolvedValue(5);
    tokenRepo.cleanExpiredBlacklist.mockResolvedValue(3);
    const useCase = new CleanupExpiredTokensUseCase(tokenRepo);

    const result = await useCase.execute();

    expect(result).toEqual({ refreshTokens: 5, blacklistTokens: 3 });
  });
});
