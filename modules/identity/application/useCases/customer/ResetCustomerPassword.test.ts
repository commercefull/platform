import { emitMock, lazyMock } from '../../../tests/testUtils';
import { ResetCustomerPasswordUseCase } from './ResetCustomerPassword';
import {
  EmailRequiredOnlyError,
  TokenRequiredError,
  PasswordTooShortError,
  InvalidOrExpiredTokenError,
  TokenAlreadyUsedError,
  TokenExpiredError,
} from '../../../domain/errors/IdentityErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('ResetCustomerPasswordUseCase', () => {
  let useCase: ResetCustomerPasswordUseCase;
  let mockCustomerRepo: jest.Mocked<ConstructorParameters<typeof ResetCustomerPasswordUseCase>[0]>;
  let mockPasswordResetRepo: jest.Mocked<ConstructorParameters<typeof ResetCustomerPasswordUseCase>[1]>;
  let mockAuthService: jest.Mocked<ConstructorParameters<typeof ResetCustomerPasswordUseCase>[2]>;
  let mockEmailService: jest.Mocked<ConstructorParameters<typeof ResetCustomerPasswordUseCase>[3]>;

  beforeEach(() => {
    mockCustomerRepo = lazyMock<ConstructorParameters<typeof ResetCustomerPasswordUseCase>[0]>();
    mockCustomerRepo.findByEmail.mockResolvedValue({ customerId: 'c1', email: 'test@test.com', firstName: 'John' });
    mockCustomerRepo.updatePassword.mockResolvedValue(undefined);
    mockPasswordResetRepo = lazyMock<ConstructorParameters<typeof ResetCustomerPasswordUseCase>[1]>();
    mockPasswordResetRepo.create.mockResolvedValue(undefined);
    mockPasswordResetRepo.findByToken.mockResolvedValue({ customerId: 'c1', token: 'tok123', expiresAt: new Date(Date.now() + 3600000), used: false });
    mockPasswordResetRepo.markAsUsed.mockResolvedValue(undefined);
    mockAuthService = lazyMock<ConstructorParameters<typeof ResetCustomerPasswordUseCase>[2]>();
    mockAuthService.generateResetToken.mockResolvedValue('tok123');
    mockAuthService.hashPassword.mockResolvedValue('hashed-pw');
    mockEmailService = lazyMock<ConstructorParameters<typeof ResetCustomerPasswordUseCase>[3]>();
    mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);
    useCase = new ResetCustomerPasswordUseCase(
      mockCustomerRepo,
      mockPasswordResetRepo,
      mockAuthService,
      mockEmailService,
    );
  });

  it('should request password reset (happy path)', async () => {
    const result = await useCase.requestReset({ email: 'test@test.com' });

    expect(result.success).toBe(true);
    expect(mockPasswordResetRepo.create).toHaveBeenCalled();
    expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('should return success even when email not found (security)', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.requestReset({ email: 'unknown@test.com' });

    expect(result.success).toBe(true);
    expect(mockPasswordResetRepo.create).not.toHaveBeenCalled();
  });

  it('should throw EmailRequiredOnlyError when email is empty', async () => {
    await expect(useCase.requestReset({ email: '' })).rejects.toThrow(EmailRequiredOnlyError);
  });

  it('should reset password with valid token (happy path)', async () => {
    const result = await useCase.resetPassword({ token: 'tok123', newPassword: 'newpass123' });

    expect(result.success).toBe(true);
    expect(mockCustomerRepo.updatePassword).toHaveBeenCalledWith('c1', 'hashed-pw');
    expect(mockPasswordResetRepo.markAsUsed).toHaveBeenCalledWith('tok123');
  });

  it('should throw TokenRequiredError when token is empty', async () => {
    await expect(useCase.resetPassword({ token: '', newPassword: 'newpass123' })).rejects.toThrow(TokenRequiredError);
  });

  it('should throw PasswordTooShortError when password is too short', async () => {
    await expect(useCase.resetPassword({ token: 'tok123', newPassword: 'short' })).rejects.toThrow(PasswordTooShortError);
  });

  it('should throw InvalidOrExpiredTokenError when token not found', async () => {
    mockPasswordResetRepo.findByToken.mockResolvedValue(null);

    await expect(useCase.resetPassword({ token: 'invalid', newPassword: 'newpass123' })).rejects.toThrow(InvalidOrExpiredTokenError);
  });

  it('should throw TokenAlreadyUsedError when token is used', async () => {
    mockPasswordResetRepo.findByToken.mockResolvedValue({
      customerId: 'c1',
      token: 'tok123',
      expiresAt: new Date(Date.now() + 3600000),
      used: true,
    });

    await expect(useCase.resetPassword({ token: 'tok123', newPassword: 'newpass123' })).rejects.toThrow(TokenAlreadyUsedError);
  });

  it('should throw TokenExpiredError when token is expired', async () => {
    mockPasswordResetRepo.findByToken.mockResolvedValue({
      customerId: 'c1',
      token: 'tok123',
      expiresAt: new Date(Date.now() - 3600000),
      used: false,
    });

    await expect(useCase.resetPassword({ token: 'tok123', newPassword: 'newpass123' })).rejects.toThrow(TokenExpiredError);
  });
});
