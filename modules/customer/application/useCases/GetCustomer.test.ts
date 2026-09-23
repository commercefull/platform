import '../../tests/testUtils';
import { GetCustomerUseCase, GetCustomerCommand } from './GetCustomer';
import { CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { createCustomerRepository, createCustomerRow, createCustomerAddressRow } from '../../tests/testUtils';

describe('GetCustomerUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new GetCustomerUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepository.findById.mockResolvedValue(createCustomerRow());
    customerRepository.findByEmail.mockResolvedValue(createCustomerRow());
    customerRepository.getAddresses.mockResolvedValue([]);
    customerRepository.getCustomerGroupIds.mockResolvedValue(['grp-1']);
  });

  it('should throw CustomerValidationError when neither customerId nor email is provided', () => {
    expect(() => new GetCustomerCommand()).toThrow(CustomerValidationError);
  });

  it('should find the customer by id and map the detail response', async () => {
    const result = await useCase.execute(new GetCustomerCommand('cust-1'));

    expect(result).not.toBeNull();
    expect(result!.customerId).toBe('cust-1');
    expect(result!.email).toBe('jane@example.com');
    expect(result!.fullName).toBe('Jane Doe');
    expect(result!.groupIds).toEqual(['grp-1']);
    expect(customerRepository.findById).toHaveBeenCalledWith('cust-1');
  });

  it('should find the customer by email', async () => {
    const result = await useCase.execute(new GetCustomerCommand(undefined, 'jane@example.com'));

    expect(result!.customerId).toBe('cust-1');
    expect(customerRepository.findByEmail).toHaveBeenCalledWith('jane@example.com');
  });

  it('should return null when the customer is not found', async () => {
    customerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute(new GetCustomerCommand('missing'));

    expect(result).toBeNull();
    expect(customerRepository.getAddresses).not.toHaveBeenCalled();
  });

  it('should map addresses to the response format', async () => {
    customerRepository.getAddresses.mockResolvedValue([
      createCustomerAddressRow({ customerAddressId: 'addr-9', isDefaultShipping: true }),
    ]);

    const result = await useCase.execute(new GetCustomerCommand('cust-1'));

    expect(result!.addresses).toHaveLength(1);
    expect(result!.addresses[0]).toEqual(
      expect.objectContaining({ addressId: 'addr-9', addressLine1: '123 Main St', city: 'Springfield' }),
    );
  });

  it('should handle null firstName/lastName gracefully', async () => {
    customerRepository.findById.mockResolvedValue(createCustomerRow({ firstName: null, lastName: null }));

    const result = await useCase.execute(new GetCustomerCommand('cust-1'));

    expect(result!.firstName).toBe('');
    expect(result!.fullName).toBe('');
  });
});
