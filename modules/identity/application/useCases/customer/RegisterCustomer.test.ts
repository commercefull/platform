jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RegisterCustomerUseCase } from './RegisterCustomer';
import { EmailAndPasswordRequiredError, InvalidEmailFormatError, PasswordTooShortError, EmailAlreadyRegisteredError } from '../../../domain/errors/IdentityErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('RegisterCustomerUseCase', () => {
  let useCase: RegisterCustomerUseCase;
  let mockCustomerRepo: Record<string, jest.Mock>;
  let mockAuth: Record<string, jest.Mock>;
  let mockEmail: Record<string, jest.Mock>;

  beforeEach(() => {
    mockCustomerRepo = { findByEmail: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(undefined) };
    mockAuth = { hashPassword: jest.fn().mockResolvedValue('hashed'), generateVerificationToken: jest.fn().mockResolvedValue('verify-token') };
    mockEmail = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };
    useCase = new RegisterCustomerUseCase(mockCustomerRepo as never, mockAuth as never, mockEmail as never);
  });

  it('should register customer successfully (happy path)', async () => {
    const result = await useCase.execute({ email: 'new@test.com', password: 'password123', firstName: 'John' });

    expect(result.customerId).toBeDefined();
    expect(result.requiresVerification).toBe(true);
    expect(mockCustomerRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending_verification', emailVerified: false }));
    expect(eventBus.emit).toHaveBeenCalledWith('customer.registered', expect.objectContaining({ email: 'new@test.com' }));
  });

  it('should throw EmailAndPasswordRequiredError when fields missing', async () => {
    await expect(useCase.execute({ email: '', password: 'p' })).rejects.toThrow(EmailAndPasswordRequiredError);
  });

  it('should throw InvalidEmailFormatError for bad email', async () => {
    await expect(useCase.execute({ email: 'notanemail', password: 'password123' })).rejects.toThrow(InvalidEmailFormatError);
  });

  it('should throw PasswordTooShortError for short password', async () => {
    await expect(useCase.execute({ email: 'a@b.com', password: 'short' })).rejects.toThrow(PasswordTooShortError);
  });

  it('should throw EmailAlreadyRegisteredError when email exists', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue({ customerId: 'existing' });

    await expect(useCase.execute({ email: 'a@b.com', password: 'password123' })).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});
