import { lazyMock, createCredentialSubject, createRefreshTokenInfo } from '../../../tests/testUtils';
import { IssueTokenPairUseCase, IssueTokenPairCommand, IssueTokenPairConfig, JwtTokenPort } from './IssueTokenPair';
import type { CredentialSubjectPort } from '../../ports/CredentialSubjectPort';
import type { TokenRepository } from '../../../domain/repositories/TokenRepository';
import {
  EmailAndPasswordRequiredError,
  InvalidCredentialsError,
  AccountNotActiveError,
} from '../../../domain/errors/IdentityErrors';

describe('IssueTokenPairUseCase', () => {
  let credentialPort: jest.Mocked<CredentialSubjectPort>;
  let tokenRepo: jest.Mocked<TokenRepository>;
  let jwt: jest.Mocked<JwtTokenPort>;

  const config: IssueTokenPairConfig = {
    userType: 'customer',
    jwtSecret: 'test-secret',
    accessTokenDuration: '7d',
    refreshTokenDuration: '30d',
    requireActiveStatus: false,
    trackLoginTimestamp: true,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    credentialPort = lazyMock<CredentialSubjectPort>();
    tokenRepo = lazyMock<TokenRepository>();
    jwt = lazyMock<JwtTokenPort>();
    jwt.sign.mockReturnValue('signed-token');
    tokenRepo.createRefreshToken.mockResolvedValue(createRefreshTokenInfo());
  });

  it('should sign the refresh token with tokenUse refresh when issuing a pair', async () => {
    credentialPort.authenticate.mockResolvedValue(createCredentialSubject());
    const useCase = new IssueTokenPairUseCase(credentialPort, tokenRepo, jwt, config);

    await useCase.execute(new IssueTokenPairCommand('a@b.com', 'pw'));

    expect(jwt.sign).toHaveBeenCalledWith('subject-1', expect.any(String), 'customer', 'test-secret', '30d', 'refresh');
  });

  it('should issue an access/refresh pair and persist the refresh token', async () => {
    credentialPort.authenticate.mockResolvedValue(createCredentialSubject());
    const useCase = new IssueTokenPairUseCase(credentialPort, tokenRepo, jwt, config);

    const result = await useCase.execute(new IssueTokenPairCommand('a@b.com', 'pw', 'agent', '1.2.3.4'));

    expect(result.accessToken).toBe('signed-token');
    expect(result.refreshToken).toBe('signed-token');
    expect(result.expiresIn).toBe('7d');
    expect(tokenRepo.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'signed-token', userType: 'customer', userId: 'subject-1', userAgent: 'agent', ipAddress: '1.2.3.4' }),
    );
  });

  it('should track login timestamp when configured', async () => {
    credentialPort.authenticate.mockResolvedValue(createCredentialSubject());
    const useCase = new IssueTokenPairUseCase(credentialPort, tokenRepo, jwt, config);

    await useCase.execute(new IssueTokenPairCommand('a@b.com', 'pw'));

    expect(credentialPort.updateLoginTimestamp).toHaveBeenCalledWith('subject-1');
  });

  it('should not track login timestamp when disabled', async () => {
    credentialPort.authenticate.mockResolvedValue(createCredentialSubject());
    const useCase = new IssueTokenPairUseCase(credentialPort, tokenRepo, jwt, { ...config, trackLoginTimestamp: false });

    await useCase.execute(new IssueTokenPairCommand('a@b.com', 'pw'));

    expect(credentialPort.updateLoginTimestamp).not.toHaveBeenCalled();
  });

  it('should reject inactive subjects when status check is required', async () => {
    credentialPort.authenticate.mockResolvedValue(createCredentialSubject({ status: 'pending' }));
    const useCase = new IssueTokenPairUseCase(credentialPort, tokenRepo, jwt, { ...config, requireActiveStatus: true });

    await expect(useCase.execute(new IssueTokenPairCommand('a@b.com', 'pw'))).rejects.toThrow(AccountNotActiveError);
    expect(tokenRepo.createRefreshToken).not.toHaveBeenCalled();
  });

  it('should allow non-active subjects when status check is not required', async () => {
    credentialPort.authenticate.mockResolvedValue(createCredentialSubject({ status: 'pending' }));
    const useCase = new IssueTokenPairUseCase(credentialPort, tokenRepo, jwt, config);

    const result = await useCase.execute(new IssueTokenPairCommand('a@b.com', 'pw'));

    expect(result.accessToken).toBe('signed-token');
  });

  it('should throw EmailAndPasswordRequiredError when credentials are missing', async () => {
    const useCase = new IssueTokenPairUseCase(credentialPort, tokenRepo, jwt, config);

    await expect(useCase.execute(new IssueTokenPairCommand('', 'pw'))).rejects.toThrow(EmailAndPasswordRequiredError);
    await expect(useCase.execute(new IssueTokenPairCommand('a@b.com', ''))).rejects.toThrow(EmailAndPasswordRequiredError);
  });

  it('should throw InvalidCredentialsError when authentication fails', async () => {
    credentialPort.authenticate.mockResolvedValue(null);
    const useCase = new IssueTokenPairUseCase(credentialPort, tokenRepo, jwt, config);

    await expect(useCase.execute(new IssueTokenPairCommand('a@b.com', 'bad'))).rejects.toThrow(InvalidCredentialsError);
  });
});
