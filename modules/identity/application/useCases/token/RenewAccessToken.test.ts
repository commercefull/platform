import { lazyMock, createCredentialSubject, createRefreshTokenInfo, emitMock } from '../../../tests/testUtils';
import { RenewAccessTokenUseCase, RenewAccessTokenCommand, RenewAccessTokenConfig } from './RenewAccessToken';
import type { JwtTokenPort } from './IssueTokenPair';
import type { CredentialSubjectPort } from '../../ports/CredentialSubjectPort';
import type { TokenRepository } from '../../../domain/repositories/TokenRepository';
import {
  RefreshTokenRequiredError,
  InvalidRefreshTokenError,
  AccountNotActiveError,
} from '../../../domain/errors/IdentityErrors';

describe('RenewAccessTokenUseCase', () => {
  let credentialPort: jest.Mocked<CredentialSubjectPort>;
  let tokenRepo: jest.Mocked<TokenRepository>;
  let jwt: jest.Mocked<JwtTokenPort>;
  let useCase: RenewAccessTokenUseCase;

  const config: RenewAccessTokenConfig = {
    userType: 'customer',
    jwtSecret: 'test-secret',
    accessTokenDuration: '7d',
    requireActiveStatus: false,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    credentialPort = lazyMock<CredentialSubjectPort>();
    tokenRepo = lazyMock<TokenRepository>();
    jwt = lazyMock<JwtTokenPort>();
    jwt.verify.mockReturnValue({ id: 'subject-1', email: 'subject@test.com' });
    jwt.sign.mockReturnValue('new-access-token');
    tokenRepo.findRefreshToken.mockResolvedValue(createRefreshTokenInfo());
    tokenRepo.markRefreshTokenUsed.mockResolvedValue(true);
    credentialPort.findById.mockResolvedValue(createCredentialSubject());
    useCase = new RenewAccessTokenUseCase(credentialPort, tokenRepo, jwt, config);
  });

  it('should issue a new access token for a valid refresh token', async () => {
    const result = await useCase.execute(new RenewAccessTokenCommand('refresh-token-1', '1.2.3.4'));

    expect(result.accessToken).toBe('new-access-token');
    expect(result.expiresIn).toBe('7d');
    expect(tokenRepo.markRefreshTokenUsed).toHaveBeenCalledWith('refresh-token-1');
  });

  it('should emit a customer token_refreshed event', async () => {
    await useCase.execute(new RenewAccessTokenCommand('refresh-token-1'));

    expect(emitMock).toHaveBeenCalledWith('identity.customer.token_refreshed', expect.objectContaining({ userId: 'subject-1', userType: 'customer' }));
  });

  it('should emit an organization token_refreshed event for organization config', async () => {
    const orgUseCase = new RenewAccessTokenUseCase(credentialPort, tokenRepo, jwt, { ...config, userType: 'organization' });
    tokenRepo.findRefreshToken.mockResolvedValue(createRefreshTokenInfo({ userType: 'organization' }));

    await orgUseCase.execute(new RenewAccessTokenCommand('refresh-token-1'));

    expect(emitMock).toHaveBeenCalledWith(
      'identity.organization.token_refreshed',
      expect.objectContaining({ userId: 'subject-1', userType: 'organization' }),
    );
  });

  it('should throw RefreshTokenRequiredError when token is missing', async () => {
    await expect(useCase.execute(new RenewAccessTokenCommand(''))).rejects.toThrow(RefreshTokenRequiredError);
  });

  it('should throw InvalidRefreshTokenError when the signature is invalid', async () => {
    jwt.verify.mockReturnValue(null);

    await expect(useCase.execute(new RenewAccessTokenCommand('bad'))).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('should throw InvalidRefreshTokenError when the stored token does not match', async () => {
    tokenRepo.findRefreshToken.mockResolvedValue(null);
    await expect(useCase.execute(new RenewAccessTokenCommand('refresh-token-1'))).rejects.toThrow(InvalidRefreshTokenError);

    tokenRepo.findRefreshToken.mockResolvedValue(createRefreshTokenInfo({ userId: 'other-user' }));
    await expect(useCase.execute(new RenewAccessTokenCommand('refresh-token-1'))).rejects.toThrow(InvalidRefreshTokenError);

    tokenRepo.findRefreshToken.mockResolvedValue(createRefreshTokenInfo({ userType: 'organization' }));
    await expect(useCase.execute(new RenewAccessTokenCommand('refresh-token-1'))).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('should throw InvalidRefreshTokenError when the subject no longer exists', async () => {
    credentialPort.findById.mockResolvedValue(null);

    await expect(useCase.execute(new RenewAccessTokenCommand('refresh-token-1'))).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('should throw AccountNotActiveError when subject is inactive and status is required', async () => {
    credentialPort.findById.mockResolvedValue(createCredentialSubject({ status: 'suspended' }));
    const orgUseCase = new RenewAccessTokenUseCase(credentialPort, tokenRepo, jwt, { ...config, requireActiveStatus: true });

    await expect(orgUseCase.execute(new RenewAccessTokenCommand('refresh-token-1'))).rejects.toThrow(AccountNotActiveError);
  });
});
