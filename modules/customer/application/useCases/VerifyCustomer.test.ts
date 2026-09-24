import '../../tests/testUtils';
import { VerifyCustomerUseCase, VerifyCustomerCommand } from './VerifyCustomer';
import { CustomerNotFoundError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { createCustomerRepository, createCustomerRow, emitMock } from '../../tests/testUtils';

describe('VerifyCustomerUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new VerifyCustomerUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepository.findById.mockResolvedValue(createCustomerRow({ isVerified: false }));
    customerRepository.verifyEmail.mockResolvedValue(undefined);
    customerRepository.verifyPhone.mockResolvedValue(undefined);
  });

  it('should verify the email and emit customer.verified when verification type is email', async () => {
    const result = await useCase.execute(new VerifyCustomerCommand('cust-1', 'email'));

    expect(result.success).toBe(true);
    expect(customerRepository.verifyEmail).toHaveBeenCalledWith('cust-1');
    expect(customerRepository.verifyPhone).not.toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith(
      'customer.verified',
      expect.objectContaining({ customerId: 'cust-1', verificationType: 'email' }),
    );
  });

  it('should verify the phone when verification type is phone', async () => {
    const result = await useCase.execute(new VerifyCustomerCommand('cust-1', 'phone'));

    expect(result.success).toBe(true);
    expect(customerRepository.verifyPhone).toHaveBeenCalledWith('cust-1');
    expect(customerRepository.verifyEmail).not.toHaveBeenCalled();
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new VerifyCustomerCommand('', 'email'))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerNotFoundError when the customer does not exist', async () => {
    customerRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new VerifyCustomerCommand('missing', 'email'))).rejects.toThrow(CustomerNotFoundError);
    expect(customerRepository.verifyEmail).not.toHaveBeenCalled();
  });

  it('should return success without re-verifying when the customer is already verified', async () => {
    customerRepository.findById.mockResolvedValue(createCustomerRow({ isVerified: true }));

    const result = await useCase.execute(new VerifyCustomerCommand('cust-1', 'email'));

    expect(result.success).toBe(true);
    expect(customerRepository.verifyEmail).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
