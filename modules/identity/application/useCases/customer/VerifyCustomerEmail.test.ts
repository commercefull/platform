import { emitMock, lazyMock } from '../../../tests/testUtils';
import { VerifyCustomerEmailUseCase } from './VerifyCustomerEmail';
import {
  VerificationTokenRequiredError,
  InvalidVerificationTokenError,
  VerificationTokenAlreadyUsedError,
  VerificationTokenExpiredError,
  EmailRequiredOnlyError,
  EmailAlreadyVerifiedError,
} from '../../../domain/errors/IdentityErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('VerifyCustomerEmailUseCase', () => {
  let useCase: VerifyCustomerEmailUseCase;
  let mockCustomerRepo: jest.Mocked<ConstructorParameters<typeof VerifyCustomerEmailUseCase>[0]>;
  let mockVerifyRepo: jest.Mocked<ConstructorParameters<typeof VerifyCustomerEmailUseCase>[1]>;
  let mockAuth: jest.Mocked<ConstructorParameters<typeof VerifyCustomerEmailUseCase>[2]>;
  let mockEmail: jest.Mocked<ConstructorParameters<typeof VerifyCustomerEmailUseCase>[3]>;

  beforeEach(() => {
    mockCustomerRepo = lazyMock<ConstructorParameters<typeof VerifyCustomerEmailUseCase>[0]>();
    mockCustomerRepo.findByEmail.mockResolvedValue(null);
    mockCustomerRepo.update.mockResolvedValue(undefined);
    mockVerifyRepo = lazyMock<ConstructorParameters<typeof VerifyCustomerEmailUseCase>[1]>();
    mockVerifyRepo.findByToken.mockResolvedValue(null);
    mockVerifyRepo.markAsUsed.mockResolvedValue(undefined);
    mockVerifyRepo.create.mockResolvedValue(undefined);
    mockAuth = lazyMock<ConstructorParameters<typeof VerifyCustomerEmailUseCase>[2]>();
    mockAuth.generateVerificationToken.mockResolvedValue('new-token');
    mockEmail = lazyMock<ConstructorParameters<typeof VerifyCustomerEmailUseCase>[3]>();
    mockEmail.sendVerificationEmail.mockResolvedValue(undefined);
    useCase = new VerifyCustomerEmailUseCase(mockCustomerRepo, mockVerifyRepo, mockAuth, mockEmail);
  });

  it('should verify email successfully (happy path)', async () => {
    mockVerifyRepo.findByToken.mockResolvedValue({
      customerId: 'c1',
      token: 'valid',
      expiresAt: new Date(Date.now() + 3600000),
      used: false,
    });

    const result = await useCase.verify({ token: 'valid' });

    expect(result.success).toBe(true);
    expect(result.customerId).toBe('c1');
    expect(mockCustomerRepo.update).toHaveBeenCalledWith('c1', { emailVerified: true, status: 'active' });
    expect(emitMock).toHaveBeenCalledWith('customer.email_verified', expect.objectContaining({ customerId: 'c1' }));
  });

  it('should throw VerificationTokenRequiredError when token missing', async () => {
    await expect(useCase.verify({ token: '' })).rejects.toThrow(VerificationTokenRequiredError);
  });

  it('should throw InvalidVerificationTokenError when token not found', async () => {
    await expect(useCase.verify({ token: 'missing' })).rejects.toThrow(InvalidVerificationTokenError);
  });

  it('should throw VerificationTokenAlreadyUsedError when already used', async () => {
    mockVerifyRepo.findByToken.mockResolvedValue({ customerId: 'c1', token: 't', expiresAt: new Date(Date.now() + 3600000), used: true });

    await expect(useCase.verify({ token: 't' })).rejects.toThrow(VerificationTokenAlreadyUsedError);
  });

  it('should throw VerificationTokenExpiredError when expired', async () => {
    mockVerifyRepo.findByToken.mockResolvedValue({ customerId: 'c1', token: 't', expiresAt: new Date(Date.now() - 3600000), used: false });

    await expect(useCase.verify({ token: 't' })).rejects.toThrow(VerificationTokenExpiredError);
  });

  it('should resend verification email', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue({ customerId: 'c1', email: 'c@t.com', emailVerified: false, firstName: 'John' });

    const result = await useCase.resendVerification({ email: 'c@t.com' });

    expect(result.success).toBe(true);
    expect(mockVerifyRepo.create).toHaveBeenCalled();
  });

  it('should throw EmailRequiredOnlyError when email missing', async () => {
    await expect(useCase.resendVerification({ email: '' })).rejects.toThrow(EmailRequiredOnlyError);
  });

  it('should throw EmailAlreadyVerifiedError when already verified', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue({ customerId: 'c1', email: 'c@t.com', emailVerified: true });

    await expect(useCase.resendVerification({ email: 'c@t.com' })).rejects.toThrow(EmailAlreadyVerifiedError);
  });

  it('should return generic message when email not found for resend', async () => {
    const result = await useCase.resendVerification({ email: 'unknown@test.com' });

    expect(result.success).toBe(true);
    expect(result.message).toContain('If the email exists');
  });
});
