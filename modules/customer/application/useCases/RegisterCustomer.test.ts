import '../../tests/testUtils';
import { RegisterCustomerUseCase, RegisterCustomerCommand } from './RegisterCustomer';
import { CustomerEmailAlreadyExistsError, EmailRequiredError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import {
  createCustomerRepository,
  createCustomerRow,
  emitMock,
  uuidMock,
  hashStringMock,
  withTransactionMock,
} from '../../tests/testUtils';

describe('RegisterCustomerUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new RegisterCustomerUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    uuidMock.mockReturnValue('new-cust-id');
    hashStringMock.mockResolvedValue('hashed-password');
    withTransactionMock.mockImplementation(async fn => fn({} as unknown as Parameters<Parameters<typeof withTransactionMock>[0]>[0]));
    customerRepository.findByEmail.mockResolvedValue(null);
    customerRepository.save.mockImplementation(async c => c);
    customerRepository.updatePassword.mockResolvedValue(undefined);
  });

  it('should register the customer, persist password in a transaction, and emit customer.registered', async () => {
    const result = await useCase.execute(
      new RegisterCustomerCommand({ email: 'Jane@Example.com', firstName: 'Jane', lastName: 'Doe', password: 'password123' }),
    );

    expect(result.customerId).toBe('new-cust-id');
    expect(result.email).toBe('jane@example.com');
    expect(result.isVerified).toBe(false);
    expect(hashStringMock).toHaveBeenCalledWith('password123');
    expect(withTransactionMock).toHaveBeenCalled();
    expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'new-cust-id', email: 'jane@example.com' }));
    expect(customerRepository.updatePassword).toHaveBeenCalledWith('new-cust-id', 'hashed-password');
    expect(emitMock).toHaveBeenCalledWith(
      'customer.registered',
      expect.objectContaining({ customerId: 'new-cust-id', email: 'jane@example.com' }),
    );
  });

  it('should throw EmailRequiredError when the email is empty', async () => {
    await expect(
      useCase.execute(new RegisterCustomerCommand({ email: '', firstName: 'Jane', lastName: 'Doe', password: 'password123' })),
    ).rejects.toThrow(EmailRequiredError);
    expect(customerRepository.save).not.toHaveBeenCalled();
  });

  it('should create a passwordless account when no password is provided', async () => {
    const result = await useCase.execute(new RegisterCustomerCommand({ email: 'sso@x.com', firstName: 'Sam', lastName: 'Provi' }));

    expect(result.customerId).toBe('new-cust-id');
    expect(hashStringMock).not.toHaveBeenCalled();
    expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ password: '' }));
    expect(customerRepository.updatePassword).not.toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('customer.registered', expect.objectContaining({ email: 'sso@x.com' }));
  });

  it('should allow empty names for provisioned accounts', async () => {
    const result = await useCase.execute(new RegisterCustomerCommand({ email: 'scim@x.com', firstName: '', lastName: '', password: '' }));

    expect(result.customerId).toBe('new-cust-id');
    expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ firstName: '', lastName: '' }));
  });

  it('should honor isActive and isVerified flags', async () => {
    await useCase.execute(
      new RegisterCustomerCommand({
        email: 'prov@x.com',
        firstName: 'P',
        lastName: 'Q',
        flags: {
          isActive: false,
          isVerified: true,
        },
      }),
    );

    expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false, isVerified: true }));
  });

  it('should throw CustomerValidationError when the password is too short', async () => {
    await expect(
      useCase.execute(new RegisterCustomerCommand({ email: 'j@x.com', firstName: 'Jane', lastName: 'Doe', password: 'short' })),
    ).rejects.toThrow(CustomerValidationError);
    expect(customerRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('should throw CustomerEmailAlreadyExistsError when the email is taken', async () => {
    customerRepository.findByEmail.mockResolvedValue(createCustomerRow());

    await expect(
      useCase.execute(
        new RegisterCustomerCommand({ email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe', password: 'password123' }),
      ),
    ).rejects.toThrow(CustomerEmailAlreadyExistsError);
    expect(customerRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
