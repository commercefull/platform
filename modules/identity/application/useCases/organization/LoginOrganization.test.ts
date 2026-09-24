import { emitMock, lazyMock } from '../../../tests/testUtils';
import { LoginOrganizationUseCase } from './LoginOrganization';
import { EmailAndPasswordRequiredError, InvalidCredentialsError, AccountNotActiveError } from '../../../domain/errors/IdentityErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('LoginOrganizationUseCase', () => {
  let useCase: LoginOrganizationUseCase;
  let mockOrgRepo: jest.Mocked<ConstructorParameters<typeof LoginOrganizationUseCase>[0]>;
  let mockAuth: jest.Mocked<ConstructorParameters<typeof LoginOrganizationUseCase>[1]>;
  let mockToken: jest.Mocked<ConstructorParameters<typeof LoginOrganizationUseCase>[2]>;

  beforeEach(() => {
    mockOrgRepo = lazyMock<ConstructorParameters<typeof LoginOrganizationUseCase>[0]>();
    mockOrgRepo.findByEmail.mockResolvedValue({ organizationId: 'o1', email: 'o@test.com', passwordHash: 'hash', status: 'active', permissions: ['read'] });
    mockOrgRepo.updateLastLogin.mockResolvedValue(undefined);
    mockAuth = lazyMock<ConstructorParameters<typeof LoginOrganizationUseCase>[1]>();
    mockAuth.verifyPassword.mockResolvedValue(true);
    mockToken = lazyMock<ConstructorParameters<typeof LoginOrganizationUseCase>[2]>();
    mockToken.generateAccessToken.mockResolvedValue('access');
    mockToken.generateRefreshToken.mockResolvedValue('refresh');
    useCase = new LoginOrganizationUseCase(mockOrgRepo, mockAuth, mockToken);
  });

  it('should login organization successfully (happy path)', async () => {
    const result = await useCase.execute({ email: 'o@test.com', password: 'pass123' });

    expect(result.organizationId).toBe('o1');
    expect(result.expiresIn).toBe(28800);
    expect(emitMock).toHaveBeenCalledWith('organization.logged_in', expect.objectContaining({ organizationId: 'o1' }));
  });

  it('should set 7-day expiry with rememberMe', async () => {
    const result = await useCase.execute({ email: 'o@test.com', password: 'pass123', rememberMe: true });

    expect(result.expiresIn).toBe(604800);
  });

  it('should throw EmailAndPasswordRequiredError when fields missing', async () => {
    await expect(useCase.execute({ email: '', password: 'p' })).rejects.toThrow(EmailAndPasswordRequiredError);
  });

  it('should throw InvalidCredentialsError when org not found', async () => {
    mockOrgRepo.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'x@t.com', password: 'p' })).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw AccountNotActiveError when status is pending', async () => {
    mockOrgRepo.findByEmail.mockResolvedValue({ organizationId: 'o1', email: 'o@t.com', passwordHash: 'h', status: 'pending' });

    await expect(useCase.execute({ email: 'o@t.com', password: 'pass' })).rejects.toThrow(AccountNotActiveError);
  });

  it('should allow login with approved status', async () => {
    mockOrgRepo.findByEmail.mockResolvedValue({
      organizationId: 'o1',
      email: 'o@t.com',
      passwordHash: 'h',
      status: 'approved',
      permissions: [],
    });

    const result = await useCase.execute({ email: 'o@t.com', password: 'pass' });

    expect(result.organizationId).toBe('o1');
  });
});
