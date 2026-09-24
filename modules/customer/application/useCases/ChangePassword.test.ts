import '../../tests/testUtils';
import { ChangePasswordUseCase, ChangePasswordCommand } from './ChangePassword';
import { CustomerNotFoundError, CustomerValidationError, InvalidCredentialsError } from '../../domain/errors/CustomerErrors';
import {
  createCustomerRepository,
  createCustomerRow,
  compareStringMock,
  hashStringMock,
  emitMock,
} from '../../tests/testUtils';

describe('ChangePasswordUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new ChangePasswordUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepository.findById.mockResolvedValue(createCustomerRow());
    customerRepository.getPasswordHash.mockResolvedValue('current-hash');
    customerRepository.updatePassword.mockResolvedValue(undefined);
  });

  it('should change the password and emit customer.password_changed when credentials are valid', async () => {
    const result = await useCase.execute(new ChangePasswordCommand('cust-1', 'old-password', 'new-password-123'));

    expect(result.success).toBe(true);
    expect(hashStringMock).toHaveBeenCalledWith('new-password-123', 12);
    expect(customerRepository.updatePassword).toHaveBeenCalledWith('cust-1', 'hashed-password');
    expect(emitMock).toHaveBeenCalledWith('customer.password_changed', { customerId: 'cust-1' });
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new ChangePasswordCommand('', 'old', 'new-password-123'))).rejects.toThrow(
      CustomerValidationError,
    );
    expect(customerRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw CustomerValidationError when the current password is empty', async () => {
    await expect(useCase.execute(new ChangePasswordCommand('cust-1', '', 'new-password-123'))).rejects.toThrow(
      CustomerValidationError,
    );
  });

  it('should throw CustomerValidationError when the new password is too short', async () => {
    await expect(useCase.execute(new ChangePasswordCommand('cust-1', 'old', 'short'))).rejects.toThrow(
      CustomerValidationError,
    );
  });

  it('should throw CustomerNotFoundError when the customer does not exist', async () => {
    customerRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ChangePasswordCommand('missing', 'old', 'new-password-123'))).rejects.toThrow(
      CustomerNotFoundError,
    );
    expect(customerRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('should throw CustomerValidationError when no password is set', async () => {
    customerRepository.getPasswordHash.mockResolvedValue(null);

    await expect(useCase.execute(new ChangePasswordCommand('cust-1', 'old', 'new-password-123'))).rejects.toThrow(
      CustomerValidationError,
    );
  });

  it('should throw InvalidCredentialsError when the current password is wrong', async () => {
    compareStringMock.mockResolvedValue(false);

    await expect(useCase.execute(new ChangePasswordCommand('cust-1', 'wrong', 'new-password-123'))).rejects.toThrow(
      InvalidCredentialsError,
    );
    expect(customerRepository.updatePassword).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
