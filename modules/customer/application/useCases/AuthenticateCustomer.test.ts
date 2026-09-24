import '../../tests/testUtils';
import { AuthenticateCustomerUseCase, AuthenticateCustomerCommand } from './AuthenticateCustomer';
import { EmailRequiredError, PasswordRequiredError } from '../../domain/errors/CustomerErrors';
import { createCustomerRepository, createCustomerRow, compareStringMock } from '../../tests/testUtils';

describe('AuthenticateCustomerUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new AuthenticateCustomerUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepository.findByEmail.mockResolvedValue(createCustomerRow());
    customerRepository.getPasswordHash.mockResolvedValue('stored-hash');
    customerRepository.recordLogin.mockResolvedValue(undefined);
  });

  it('should authenticate and record the login when credentials are valid', async () => {
    const result = await useCase.execute(new AuthenticateCustomerCommand('jane@example.com', 'password123'));

    expect(result).not.toBeNull();
    expect(result!.customerId).toBe('cust-1');
    expect(result!.email).toBe('jane@example.com');
    expect(compareStringMock).toHaveBeenCalledWith('password123', 'stored-hash');
    expect(customerRepository.recordLogin).toHaveBeenCalledWith('cust-1');
  });

  it('should throw EmailRequiredError when email is empty', async () => {
    await expect(useCase.execute(new AuthenticateCustomerCommand('', 'password123'))).rejects.toThrow(EmailRequiredError);
    expect(customerRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('should throw PasswordRequiredError when password is empty', async () => {
    await expect(useCase.execute(new AuthenticateCustomerCommand('jane@example.com', ''))).rejects.toThrow(
      PasswordRequiredError,
    );
    expect(customerRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('should return null when the customer is not found', async () => {
    customerRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute(new AuthenticateCustomerCommand('unknown@example.com', 'password123'));

    expect(result).toBeNull();
    expect(customerRepository.recordLogin).not.toHaveBeenCalled();
  });

  it('should return null when the customer has no password hash', async () => {
    customerRepository.getPasswordHash.mockResolvedValue(null);

    const result = await useCase.execute(new AuthenticateCustomerCommand('jane@example.com', 'password123'));

    expect(result).toBeNull();
    expect(compareStringMock).not.toHaveBeenCalled();
  });

  it('should return null when the password does not match', async () => {
    compareStringMock.mockResolvedValue(false);

    const result = await useCase.execute(new AuthenticateCustomerCommand('jane@example.com', 'wrong-password'));

    expect(result).toBeNull();
    expect(customerRepository.recordLogin).not.toHaveBeenCalled();
  });
});
