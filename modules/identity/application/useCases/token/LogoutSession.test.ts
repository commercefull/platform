import { lazyMock, emitMock } from '../../../tests/testUtils';
import { LogoutSessionUseCase, LogoutSessionCommand } from './LogoutSession';
import type { TokenRepository } from '../../../domain/repositories/TokenRepository';

describe('LogoutSessionUseCase', () => {
  let tokenRepo: jest.Mocked<TokenRepository>;
  let useCase: LogoutSessionUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    tokenRepo = lazyMock<TokenRepository>();
    useCase = new LogoutSessionUseCase(tokenRepo);
  });

  it('should blacklist the access token and revoke the refresh token', async () => {
    await useCase.execute(new LogoutSessionCommand('cust-1', 'customer', 'access-tok', 'refresh-tok'));

    expect(tokenRepo.blacklistToken).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'access-tok', userId: 'cust-1', userType: 'customer' }),
    );
    expect(tokenRepo.revokeRefreshToken).toHaveBeenCalledWith('refresh-tok');
    expect(emitMock).toHaveBeenCalledWith('customer.logged_out', { customerId: 'cust-1' });
  });

  it('should skip refresh token revocation when not provided', async () => {
    await useCase.execute(new LogoutSessionCommand('cust-1', 'customer', 'access-tok'));

    expect(tokenRepo.blacklistToken).toHaveBeenCalled();
    expect(tokenRepo.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it('should not emit a customer logout event for organization sessions', async () => {
    await useCase.execute(new LogoutSessionCommand('org-1', 'organization', 'access-tok'));

    expect(emitMock).not.toHaveBeenCalledWith('customer.logged_out', expect.anything());
  });
});
