import { createAdminUser, emitMock, lazyMock } from '../../../tests/testUtils';
import { LoginAdminUseCase } from './LoginAdmin';
import { EmailAndPasswordRequiredError, InvalidCredentialsError, AccountNotActiveError } from '../../../domain/errors/IdentityErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('LoginAdminUseCase', () => {
  let useCase: LoginAdminUseCase;
  let mockAdminRepo: jest.Mocked<ConstructorParameters<typeof LoginAdminUseCase>[0]>;
  let mockAuth: jest.Mocked<ConstructorParameters<typeof LoginAdminUseCase>[1]>;
  let mockSession: jest.Mocked<ConstructorParameters<typeof LoginAdminUseCase>[2]>;

  beforeEach(() => {
    mockAdminRepo = lazyMock<ConstructorParameters<typeof LoginAdminUseCase>[0]>();
    mockAdminRepo.findByEmail.mockResolvedValue(createAdminUser({ adminId: 'a1' }));
    mockAdminRepo.updateLastLogin.mockResolvedValue(undefined);
    mockAuth = lazyMock<ConstructorParameters<typeof LoginAdminUseCase>[1]>();
    mockAuth.verifyPassword.mockResolvedValue(true);
    mockSession = lazyMock<ConstructorParameters<typeof LoginAdminUseCase>[2]>();
    mockSession.createSession.mockResolvedValue('session-1');
    useCase = new LoginAdminUseCase(mockAdminRepo, mockAuth, mockSession);
  });

  it('should login admin successfully (happy path)', async () => {
    const result = await useCase.execute({ email: 'admin@test.com', password: 'pass123' });

    expect(result.adminId).toBe('a1');
    expect(result.sessionId).toBe('session-1');
    expect(mockAdminRepo.updateLastLogin).toHaveBeenCalledWith('a1');
    expect(emitMock).toHaveBeenCalledWith('admin.logged_in', expect.objectContaining({ adminId: 'a1' }));
  });

  it('should throw EmailAndPasswordRequiredError when fields missing', async () => {
    await expect(useCase.execute({ email: '', password: 'pass' })).rejects.toThrow(EmailAndPasswordRequiredError);
    await expect(useCase.execute({ email: 'a@b.com', password: '' })).rejects.toThrow(EmailAndPasswordRequiredError);
  });

  it('should throw InvalidCredentialsError when admin not found', async () => {
    mockAdminRepo.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'unknown@test.com', password: 'pass' })).rejects.toThrow(InvalidCredentialsError);
    expect(emitMock).toHaveBeenCalledWith('admin.login_failed', expect.objectContaining({ reason: 'user_not_found' }));
  });

  it('should throw InvalidCredentialsError when password is wrong', async () => {
    mockAuth.verifyPassword.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'admin@test.com', password: 'wrong' })).rejects.toThrow(InvalidCredentialsError);
    expect(emitMock).toHaveBeenCalledWith('admin.login_failed', expect.objectContaining({ reason: 'invalid_password' }));
  });

  it('should throw AccountNotActiveError when admin is suspended', async () => {
    mockAdminRepo.findByEmail.mockResolvedValue(createAdminUser({ adminId: 'a1', status: 'suspended' }));

    await expect(useCase.execute({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(AccountNotActiveError);
  });
});
