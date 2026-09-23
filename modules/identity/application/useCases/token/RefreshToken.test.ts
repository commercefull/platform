import { lazyMock } from '../../../tests/testUtils';
import { RefreshTokenUseCase } from './RefreshToken';
import {
  RefreshTokenRequiredError,
  InvalidRefreshTokenError,
  RefreshTokenRevokedError,
  RefreshTokenExpiredError,
  AccountNotActiveError,
  InvalidTokenRecordError,
} from '../../../domain/errors/IdentityErrors';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockRefreshRepo: jest.Mocked<ConstructorParameters<typeof RefreshTokenUseCase>[0]>;
  let mockToken: jest.Mocked<ConstructorParameters<typeof RefreshTokenUseCase>[1]>;
  let mockCustomerRepo: jest.Mocked<ConstructorParameters<typeof RefreshTokenUseCase>[2]>;
  let mockOrgRepo: jest.Mocked<ConstructorParameters<typeof RefreshTokenUseCase>[3]>;

  beforeEach(() => {
    mockRefreshRepo = lazyMock<ConstructorParameters<typeof RefreshTokenUseCase>[0]>();
    mockRefreshRepo.findByToken.mockResolvedValue(null);
    mockRefreshRepo.revoke.mockResolvedValue(undefined);
    mockToken = lazyMock<ConstructorParameters<typeof RefreshTokenUseCase>[1]>();
    mockToken.generateAccessToken.mockResolvedValue('new-access');
    mockToken.generateRefreshToken.mockResolvedValue('new-refresh');
    mockCustomerRepo = lazyMock<ConstructorParameters<typeof RefreshTokenUseCase>[2]>();
    mockCustomerRepo.findById.mockResolvedValue(null);
    mockOrgRepo = lazyMock<ConstructorParameters<typeof RefreshTokenUseCase>[3]>();
    mockOrgRepo.findById.mockResolvedValue(null);
    useCase = new RefreshTokenUseCase(mockRefreshRepo, mockToken, mockCustomerRepo, mockOrgRepo);
  });

  it('should refresh customer token (happy path)', async () => {
    mockRefreshRepo.findByToken.mockResolvedValue({
      token: 'valid',
      customerId: 'c1',
      revoked: false,
      expiresAt: new Date(Date.now() + 3600000),
    });
    mockCustomerRepo.findById.mockResolvedValue({ customerId: 'c1', email: 'c@t.com', status: 'active' });

    const result = await useCase.execute({ refreshToken: 'valid' });

    expect(result.accessToken).toBe('new-access');
    expect(result.expiresIn).toBe(86400);
    expect(mockRefreshRepo.revoke).toHaveBeenCalledWith('valid');
  });

  it('should refresh organization token', async () => {
    mockRefreshRepo.findByToken.mockResolvedValue({
      token: 'valid',
      organizationId: 'o1',
      revoked: false,
      expiresAt: new Date(Date.now() + 3600000),
    });
    mockOrgRepo.findById.mockResolvedValue({ organizationId: 'o1', email: 'o@t.com', status: 'active', permissions: [] });

    const result = await useCase.execute({ refreshToken: 'valid' });

    expect(result.expiresIn).toBe(28800);
  });

  it('should throw RefreshTokenRequiredError when token missing', async () => {
    await expect(useCase.execute({ refreshToken: '' })).rejects.toThrow(RefreshTokenRequiredError);
  });

  it('should throw InvalidRefreshTokenError when token not found', async () => {
    await expect(useCase.execute({ refreshToken: 'missing' })).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('should throw RefreshTokenRevokedError when revoked', async () => {
    mockRefreshRepo.findByToken.mockResolvedValue({
      token: 't',
      customerId: 'c1',
      revoked: true,
      expiresAt: new Date(Date.now() + 3600000),
    });

    await expect(useCase.execute({ refreshToken: 't' })).rejects.toThrow(RefreshTokenRevokedError);
  });

  it('should throw RefreshTokenExpiredError when expired', async () => {
    mockRefreshRepo.findByToken.mockResolvedValue({
      token: 't',
      customerId: 'c1',
      revoked: false,
      expiresAt: new Date(Date.now() - 3600000),
    });

    await expect(useCase.execute({ refreshToken: 't' })).rejects.toThrow(RefreshTokenExpiredError);
  });

  it('should throw AccountNotActiveError when customer is not active', async () => {
    mockRefreshRepo.findByToken.mockResolvedValue({
      token: 't',
      customerId: 'c1',
      revoked: false,
      expiresAt: new Date(Date.now() + 3600000),
    });
    mockCustomerRepo.findById.mockResolvedValue({ customerId: 'c1', email: 'c@t.com', status: 'suspended' });

    await expect(useCase.execute({ refreshToken: 't' })).rejects.toThrow(AccountNotActiveError);
  });

  it('should throw InvalidTokenRecordError when no customer or org ID', async () => {
    mockRefreshRepo.findByToken.mockResolvedValue({ token: 't', revoked: false, expiresAt: new Date(Date.now() + 3600000) });

    await expect(useCase.execute({ refreshToken: 't' })).rejects.toThrow(InvalidTokenRecordError);
  });
});
