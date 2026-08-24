jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { VerifyCustomerEmailUseCase } from './VerifyCustomerEmail';
import { VerificationTokenRequiredError, InvalidVerificationTokenError, VerificationTokenAlreadyUsedError, VerificationTokenExpiredError, EmailRequiredOnlyError, EmailAlreadyVerifiedError } from '../../../domain/errors/IdentityErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('VerifyCustomerEmailUseCase', () => {
  let useCase: VerifyCustomerEmailUseCase;
  let mockCustomerRepo: Record<string, jest.Mock>;
  let mockVerifyRepo: Record<string, jest.Mock>;
  let mockAuth: Record<string, jest.Mock>;
  let mockEmail: Record<string, jest.Mock>;

  beforeEach(() => {
    mockCustomerRepo = { findByEmail: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue(undefined) };
    mockVerifyRepo = { findByToken: jest.fn().mockResolvedValue(null), markAsUsed: jest.fn().mockResolvedValue(undefined), create: jest.fn().mockResolvedValue(undefined) };
    mockAuth = { generateVerificationToken: jest.fn().mockResolvedValue('new-token') };
    mockEmail = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };
    useCase = new VerifyCustomerEmailUseCase(mockCustomerRepo as never, mockVerifyRepo as never, mockAuth as never, mockEmail as never);
  });

  it('should verify email successfully (happy path)', async () => {
    mockVerifyRepo.findByToken.mockResolvedValue({ customerId: 'c1', token: 'valid', expiresAt: new Date(Date.now() + 3600000), used: false });

    const result = await useCase.verify({ token: 'valid' });

    expect(result.success).toBe(true);
    expect(result.customerId).toBe('c1');
    expect(mockCustomerRepo.update).toHaveBeenCalledWith('c1', { emailVerified: true, status: 'active' });
    expect(eventBus.emit).toHaveBeenCalledWith('customer.email_verified', expect.objectContaining({ customerId: 'c1' }));
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
