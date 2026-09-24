import { emitMock, lazyMock } from '../../../tests/testUtils';
import { RegisterCustomerUseCase } from './RegisterCustomer';
import {
  EmailAndPasswordRequiredError,
  InvalidEmailFormatError,
  PasswordTooShortError,
  EmailAlreadyRegisteredError,
} from '../../../domain/errors/IdentityErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('RegisterCustomerUseCase', () => {
  let useCase: RegisterCustomerUseCase;
  let mockCustomerRepo: jest.Mocked<ConstructorParameters<typeof RegisterCustomerUseCase>[0]>;
  let mockAuth: jest.Mocked<ConstructorParameters<typeof RegisterCustomerUseCase>[1]>;
  let mockEmail: jest.Mocked<ConstructorParameters<typeof RegisterCustomerUseCase>[2]>;

  beforeEach(() => {
    mockCustomerRepo = lazyMock<ConstructorParameters<typeof RegisterCustomerUseCase>[0]>();
    mockCustomerRepo.findByEmail.mockResolvedValue(null);
    mockCustomerRepo.create.mockResolvedValue(undefined);
    mockAuth = lazyMock<ConstructorParameters<typeof RegisterCustomerUseCase>[1]>();
    mockAuth.hashPassword.mockResolvedValue('hashed');
    mockAuth.generateVerificationToken.mockResolvedValue('verify-token');
    mockEmail = lazyMock<ConstructorParameters<typeof RegisterCustomerUseCase>[2]>();
    mockEmail.sendVerificationEmail.mockResolvedValue(undefined);
    useCase = new RegisterCustomerUseCase(mockCustomerRepo, mockAuth, mockEmail);
  });

  it('should register customer successfully (happy path)', async () => {
    const result = await useCase.execute({ email: 'new@test.com', password: 'password123', firstName: 'John' });

    expect(result.customerId).toBeDefined();
    expect(result.requiresVerification).toBe(true);
    expect(mockCustomerRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending_verification', emailVerified: false }));
    expect(emitMock).toHaveBeenCalledWith('customer.registered', expect.objectContaining({ email: 'new@test.com' }));
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
    mockCustomerRepo.findByEmail.mockResolvedValue({ customerId: 'existing', email: 'a@b.com' });

    await expect(useCase.execute({ email: 'a@b.com', password: 'password123' })).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});
