jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ResetCustomerPasswordUseCase} from './ResetCustomerPassword';
import {
  EmailRequiredOnlyError, TokenRequiredError, PasswordTooShortError,
  InvalidOrExpiredTokenError, TokenAlreadyUsedError, TokenExpiredError,
} from '../../../domain/errors/IdentityErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ResetCustomerPasswordUseCase', () => {
  let useCase: ResetCustomerPasswordUseCase;
  let mockCustomerRepo: Record<string, jest.Mock>;
  let mockPasswordResetRepo: Record<string, jest.Mock>;
  let mockAuthService: Record<string, jest.Mock>;
  let mockEmailService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockCustomerRepo = {
      findByEmail: jest.fn().mockResolvedValue({ customerId: 'c1', email: 'test@test.com', firstName: 'John' }),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };
    mockPasswordResetRepo = {
      create: jest.fn().mockResolvedValue(undefined),
      findByToken: jest.fn().mockResolvedValue({ customerId: 'c1', token: 'tok123', expiresAt: new Date(Date.now() + 3600000), used: false }),
      markAsUsed: jest.fn().mockResolvedValue(undefined),
    };
    mockAuthService = {
      generateResetToken: jest.fn().mockResolvedValue('tok123'),
      hashPassword: jest.fn().mockResolvedValue('hashed-pw'),
    };
    mockEmailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ResetCustomerPasswordUseCase(
      mockCustomerRepo as never, mockPasswordResetRepo as never, mockAuthService as never, mockEmailService as never,
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
    mockPasswordResetRepo.findByToken.mockResolvedValue({ customerId: 'c1', token: 'tok123', expiresAt: new Date(Date.now() + 3600000), used: true });

    await expect(useCase.resetPassword({ token: 'tok123', newPassword: 'newpass123' })).rejects.toThrow(TokenAlreadyUsedError);
  });

  it('should throw TokenExpiredError when token is expired', async () => {
    mockPasswordResetRepo.findByToken.mockResolvedValue({ customerId: 'c1', token: 'tok123', expiresAt: new Date(Date.now() - 3600000), used: false });

    await expect(useCase.resetPassword({ token: 'tok123', newPassword: 'newpass123' })).rejects.toThrow(TokenExpiredError);
  });
});
